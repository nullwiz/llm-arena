import { Agent, GameState, Move, PlayerId, GameEngine } from '@/types';
import { LLMService } from '@/services/LLMService';
import { PromptTemplateManager, GeneratedPromptTemplate } from '@/services/PromptTemplateManager';
import { WasmGameEngineAdapter } from '@/engines/WasmGameEngineAdapter';

export class LLMAgent implements Agent {
  readonly id: string;
  readonly name: string;
  readonly type = 'llm' as const;

  private llmService: LLMService;
  private providerId: string;
  private gameEngine: GameEngine;
  private retryCount = 0;
  private maxRetries = 3;
  private promptTemplate: GeneratedPromptTemplate | null = null;
  private cancelled = false;

  constructor(
    name: string,
    gameEngine: GameEngine,
    providerId: string
  ) {
    this.id = `llm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.name = name;
    this.llmService = LLMService.getInstance();
    this.providerId = providerId;
    this.gameEngine = gameEngine;
  }

  private getPromptTemplate(state: GameState): GeneratedPromptTemplate {
    if (!this.promptTemplate) {
      
      let metadata = {
        name: this.gameEngine.name,
        version: '1.0.0',
        author: 'Unknown',
        minPlayers: 2,
        maxPlayers: 2
      };

      if (this.gameEngine instanceof WasmGameEngineAdapter) {
        const wasmMetadata = this.gameEngine.metadata;
        metadata = {
          name: wasmMetadata.name,
          version: wasmMetadata.version || '1.0.0',
          author: wasmMetadata.author || 'Unknown',
          minPlayers: wasmMetadata.minPlayers || 2,
          maxPlayers: wasmMetadata.maxPlayers || 2
        };
      }

      
      const validMoves = this.gameEngine.getValidMoves(state);
      const sampleBoardDisplay = this.gameEngine.getBoardDisplay(state);

      this.promptTemplate = PromptTemplateManager.getPromptTemplate(
        metadata,
        validMoves,
        sampleBoardDisplay
      );

      
      const validation = PromptTemplateManager.validateTemplate(this.promptTemplate);
      if (!validation.isValid) {
        console.warn(`${this.name}: Prompt template validation failed:`, validation.errors);
      }
    }

    return this.promptTemplate;
  }

  private buildSystemPrompt(state: GameState): string {
    const template = this.getPromptTemplate(state);

    let systemPrompt = template.systemPrompt + '\n\n';
    systemPrompt += template.gameRulesPrompt + '\n\n';
    systemPrompt += template.moveFormatPrompt + '\n\n';

    if (template.strategicHints.length > 0) {
      systemPrompt += 'STRATEGIC HINTS:\n';
      template.strategicHints.forEach(hint => {
        systemPrompt += `- ${hint}\n`;
      });
      systemPrompt += '\n';
    }

    if (template.moveExamples.length > 0) {
      systemPrompt += 'MOVE EXAMPLES:\n';
      template.moveExamples.forEach(example => {
        systemPrompt += `- ${example}\n`;
      });
      systemPrompt += '\n';
    }

    systemPrompt += 'Respond with ONLY the move string, nothing else.';

    return systemPrompt;
  }

  private buildGamePrompt(state: GameState, playerId: PlayerId): string {
    const template = this.getPromptTemplate(state);

    
    console.log(`🔍 LLMAgent: Building prompt for player ${playerId}`);
    console.log(`🔍 LLMAgent: Game state currentPlayer: "${state.currentPlayer}"`);
    console.log(`🔍 LLMAgent: Game state moves count: ${state.moves?.length || 0}`);
    console.log(`🔍 LLMAgent: Game state result: "${state.result}"`);
    console.log(`🔍 LLMAgent: Game state board:`, typeof state.board === 'string' ? state.board.substring(0, 100) + '...' : state.board);
    console.log(`🔍 LLMAgent: Game state metadata:`, state.metadata);

    const boardDisplay = this.gameEngine.getBoardDisplay(state);
    const validMoves = this.gameEngine.getValidMoves(state);

    console.log(`🔍 LLMAgent: Board display:`, boardDisplay?.substring(0, 200) + '...');
    console.log(`🔍 LLMAgent: Valid moves count: ${validMoves.length}`);
    console.log(`🔍 LLMAgent: First few valid moves:`, validMoves.slice(0, 5));



    if (state.moves?.length === 0 && validMoves.length === 0) {
      console.warn(`⚠️ LLMAgent: No valid moves available at game start - this may indicate a game state issue`);
    }

    let prompt = `${template.stateDescriptionPrompt}\n\n`;
    prompt += `${boardDisplay}\n\n`;
    prompt += `You are playing as: ${playerId}\n`;
    prompt += `Current player: ${state.currentPlayer}\n\n`;

    if (validMoves.length > 0) {
      
      const moveStrings = validMoves.map(move =>
        typeof move.data === 'string' ? move.data : JSON.stringify(move.data)
      );

      
      console.log(`🔍 LLMAgent: Valid moves for ${playerId}:`, moveStrings.slice(0, 10));
      console.log(`🔍 LLMAgent: Valid moves player IDs:`, validMoves.slice(0, 5).map(m => m.playerId));
      console.log(`🔍 LLMAgent: Expected player: ${playerId}, State current player: ${state.currentPlayer}`);

      
      const wrongPlayerMoves = validMoves.filter(move => move.playerId !== playerId);
      if (wrongPlayerMoves.length > 0) {
        console.error(`❌ LLMAgent: CRITICAL BUG - Received moves for wrong player!`);
        console.error(`❌ LLMAgent: Expected: ${playerId}, Got moves for: ${wrongPlayerMoves[0].playerId}`);
        console.error(`❌ LLMAgent: This will cause the LLM to generate invalid moves!`);
      }

      prompt += `Valid moves (${moveStrings.length}): ${JSON.stringify(moveStrings)}\n\n`;
    }

    
    if (state.moves && state.moves.length > 0) {
      const recentMoves = state.moves.slice(-6); 
      prompt += `Recent moves:\n`;
      recentMoves.forEach((move, index) => {
        const moveStr = typeof move.data === 'string' ? move.data : JSON.stringify(move.data);
        prompt += `${recentMoves.length - index}. ${move.playerId}: ${moveStr}\n`;
      });
      prompt += '\n';
    }

    prompt += `Your move:`;

    return prompt;
  }


  private parseMove(response: string, state: GameState, playerId: PlayerId): string {
    const content = response.trim();
    console.log(`🔍 LLMAgent: Parsing move from response: "${content}"`);


    const validMoves = this.gameEngine.getValidMoves(state);
    const validMoveStrings = validMoves
      .filter(move => move.playerId === playerId)
      .map(move => move.data as string);

    console.log(`🔍 LLMAgent: Valid moves for ${playerId}:`, validMoveStrings.slice(0, 10));


    if (validMoveStrings.includes(content)) {
      console.log(`✅ LLMAgent: Exact match found: "${content}"`);
      return content;
    }


    const lowerContent = content.toLowerCase();
    const matchingMove = validMoveStrings.find(move => move.toLowerCase() === lowerContent);
    if (matchingMove) {
      console.log(`✅ LLMAgent: Case-insensitive match found: "${matchingMove}" for "${content}"`);
      return matchingMove;
    }


    for (const validMove of validMoveStrings) {
      if (content.includes(validMove)) {
        console.log(`✅ LLMAgent: Found valid move "${validMove}" within response: "${content}"`);
        return validMove;
      }


      if (content.toLowerCase().includes(validMove.toLowerCase())) {
        console.log(`✅ LLMAgent: Found valid move "${validMove}" within response (case-insensitive): "${content}"`);
        return validMove;
      }
    }

    const genericPatterns = [
      /(\w+)/g,
    ];

    for (const pattern of genericPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const candidate of matches) {
          if (validMoveStrings.includes(candidate)) {
            console.log(`✅ LLMAgent: Generic pattern match found: "${candidate}" from "${content}"`);
            return candidate;
          }


          const matchingMove = validMoveStrings.find(move => move.toLowerCase() === candidate.toLowerCase());
          if (matchingMove) {
            console.log(`✅ LLMAgent: Case-insensitive generic pattern match found: "${matchingMove}" for "${candidate}"`);
            return matchingMove;
          }
        }
      }
    }


    console.error(`❌ LLMAgent: No valid move found in response: "${content}"`);
    console.error(`❌ LLMAgent: Valid moves were:`, validMoveStrings);
    return content; // Let the game engine reject this
  }

  async getMove(state: GameState, playerId: PlayerId): Promise<Move> {
    console.log(`🤖 ${this.name}: getMove called for player ${playerId}`);
    console.log(`🎮 ${this.name}: Game state:`, state);
    console.log(`🔧 ${this.name}: Provider ID:`, this.providerId);

    
    if (this.cancelled) {
      throw new Error('Agent operation cancelled');
    }

    this.retryCount = 0;

    while (this.retryCount < this.maxRetries && !this.cancelled) {
      try {
        const prompt = this.buildGamePrompt(state, playerId);
        const systemPrompt = this.buildSystemPrompt(state);

        console.log(`${this.name} making move...`);
        console.log(`${this.name} system prompt:`, systemPrompt.substring(0, 200) + '...');
        console.log(`${this.name} game prompt:`, prompt.substring(0, 300) + '...');

        const response = await this.llmService.callLLM(this.providerId, prompt, systemPrompt);
        console.log(`${this.name} response:`, response.content);

        const moveData = this.parseMove(response.content, state, playerId);

        
        const move: Move = {
          playerId,
          data: moveData,
          timestamp: Date.now()
        };


        console.log(`🔍 LLMAgent: Created move object for ${playerId}`);
        console.log(`🔍 LLMAgent: moveData: "${moveData}"`);
        console.log(`🔍 LLMAgent: move.data: "${move.data}"`);

        
        if (this.gameEngine.validateMove(state, move)) {
          console.log(`✅ ${this.name} made valid move:`, move);
          return move;
        } else {
          console.error(`❌ ${this.name} made INVALID move - STOPPING IMMEDIATELY`);
          console.error(`❌ ${this.name}: Invalid move:`, move);
          console.error(`🛑 ${this.name}: NO RETRIES - FAILING FAST TO EXPOSE BUGS`);
          const error = new Error(`INVALID MOVE: ${this.name} generated invalid move "${move.data}" for player ${move.playerId}`);
          console.error(`🛑 ${this.name}: THROWING ERROR:`, error);
          throw error;
        }
      } catch (error) {
        console.error(`❌ ${this.name} error generating move - STOPPING IMMEDIATELY:`, error);
        console.error(`🛑 ${this.name}: NO RETRIES - FAILING FAST TO EXPOSE BUGS`);
        throw new Error(`LLM GENERATION ERROR: ${this.name} failed to generate move: ${error}`);
      }
    }

    throw new Error(`Failed to generate move after ${this.maxRetries} attempts`);
  }

  async onGameStart(_state: GameState, playerId: PlayerId): Promise<void> {
    console.log(`${this.name} (${playerId}) started playing ${this.gameEngine.name}`);
  }

  async onGameEnd(_state: GameState, result: string): Promise<void> {
    console.log(`${this.name} game ended with result: ${result}`);
  }

  async onOpponentMove(_state: GameState, move: Move): Promise<void> {
    console.log(`${this.name} observed opponent move:`, move);
  }

  getProviderId(): string {
    return this.providerId;
  }

  updateProviderId(providerId: string): void {
    this.providerId = providerId;
  }

  
  cancel(): void {
    console.log(`🛑 ${this.name}: Agent cancelled`);
    this.cancelled = true;
  }

  
  reset(): void {
    console.log(`🔄 ${this.name}: Agent reset`);
    this.cancelled = false;
    this.retryCount = 0;
  }
}
