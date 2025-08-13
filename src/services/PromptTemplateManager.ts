import { GameMetadata, AIPromptTemplate } from '../interfaces/WasmGameEngine';
import { Move } from '../types';

export interface GeneratedPromptTemplate {
  systemPrompt: string;
  gameRulesPrompt: string;
  moveFormatPrompt: string;
  strategicHints: string[];
  moveExamples: string[];
  stateDescriptionPrompt: string;
}

export class PromptTemplateManager {

  static getPromptTemplate(
    metadata: GameMetadata,
    validMoves?: Move[],
    sampleBoardDisplay?: string
  ): GeneratedPromptTemplate {
    const customPrompts = metadata.aiPrompts;
    
    if (customPrompts && this.isCompleteTemplate(customPrompts)) {
      
      return this.buildFromCustomTemplate(customPrompts);
    } else {
      
      const fallback = this.generateFallbackTemplate(metadata, validMoves, sampleBoardDisplay);
      return this.mergeTemplates(fallback, customPrompts);
    }
  }


  private static isCompleteTemplate(template: AIPromptTemplate): boolean {
    return !!(
      template.systemPrompt &&
      template.gameRulesPrompt &&
      template.moveFormatPrompt &&
      template.moveExamples &&
      template.moveExamples.length > 0
    );
  }


  private static buildFromCustomTemplate(custom: AIPromptTemplate): GeneratedPromptTemplate {
    return {
      systemPrompt: custom.systemPrompt!,
      gameRulesPrompt: custom.gameRulesPrompt!,
      moveFormatPrompt: custom.moveFormatPrompt!,
      strategicHints: custom.strategicHints || [],
      moveExamples: custom.moveExamples!,
      stateDescriptionPrompt: custom.stateDescriptionPrompt || 'The current game state is shown below:'
    };
  }


  private static generateFallbackTemplate(
    metadata: GameMetadata,
    validMoves?: Move[],
    sampleBoardDisplay?: string
  ): GeneratedPromptTemplate {
    const gameName = metadata.name;
    const gameType = metadata.gameType || 'strategy';
    const description = metadata.description || `A ${gameType} game`;
    
    
    const moveFormat = this.analyzeMoveFormat(validMoves);
    
    return {
      systemPrompt: this.generateSystemPrompt(gameName, gameType, description),
      gameRulesPrompt: this.generateGameRulesPrompt(metadata),
      moveFormatPrompt: this.generateMoveFormatPrompt(moveFormat),
      strategicHints: this.generateStrategicHints(gameType, metadata),
      moveExamples: this.generateMoveExamples(moveFormat, validMoves),
      stateDescriptionPrompt: this.generateStateDescriptionPrompt(sampleBoardDisplay)
    };
  }


  private static mergeTemplates(
    fallback: GeneratedPromptTemplate,
    custom?: AIPromptTemplate
  ): GeneratedPromptTemplate {
    if (!custom) return fallback;

    return {
      systemPrompt: custom.systemPrompt || fallback.systemPrompt,
      gameRulesPrompt: custom.gameRulesPrompt || fallback.gameRulesPrompt,
      moveFormatPrompt: custom.moveFormatPrompt || fallback.moveFormatPrompt,
      strategicHints: custom.strategicHints || fallback.strategicHints,
      moveExamples: custom.moveExamples || fallback.moveExamples,
      stateDescriptionPrompt: custom.stateDescriptionPrompt || fallback.stateDescriptionPrompt
    };
  }


  private static analyzeMoveFormat(validMoves?: Move[]): {
    type: 'uci' | 'coordinate' | 'position' | 'word' | 'number' | 'unknown';
    examples: string[];
  } {
    if (!validMoves || validMoves.length === 0) {
      return { type: 'unknown', examples: [] };
    }

    const moveStrings = validMoves.slice(0, 5).map(move => 
      typeof move.data === 'string' ? move.data : JSON.stringify(move.data)
    );

    
    if (moveStrings.some(move => /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move))) {
      return { type: 'uci', examples: moveStrings.filter(move => /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move)) };
    }

    
    if (moveStrings.some(move => /^[0-8]$/.test(move))) {
      return { type: 'position', examples: moveStrings.filter(move => /^[0-8]$/.test(move)) };
    }

    
    if (moveStrings.some(move => /^\d+,\d+$/.test(move) || move.includes('row') || move.includes('col'))) {
      return { type: 'coordinate', examples: moveStrings };
    }

    
    if (moveStrings.some(move => /^[a-zA-Z]+$/.test(move))) {
      return { type: 'word', examples: moveStrings };
    }

    
    if (moveStrings.some(move => /^\d+$/.test(move))) {
      return { type: 'number', examples: moveStrings };
    }

    return { type: 'unknown', examples: moveStrings };
  }


  private static generateSystemPrompt(gameName: string, gameType: string, description: string): string {
    return `You are an AI agent playing ${gameName}, a ${gameType} game. ${description}

Your goal is to play strategically and try to win the game. You must follow the game rules exactly and provide valid moves in the specified format.

Key principles:
- Always respond with a valid move from the available options
- Think strategically about your moves
- Follow the exact move format specified
- Be concise and only provide the move data`;
  }


  private static generateGameRulesPrompt(metadata: GameMetadata): string {
    let rules = `GAME: ${metadata.name}\n`;
    
    if (metadata.description) {
      rules += `DESCRIPTION: ${metadata.description}\n`;
    }
    
    rules += `PLAYERS: ${metadata.minPlayers}`;
    if (metadata.maxPlayers !== metadata.minPlayers) {
      rules += `-${metadata.maxPlayers}`;
    }
    rules += '\n';

    if (metadata.estimatedPlayTime) {
      rules += `ESTIMATED TIME: ${metadata.estimatedPlayTime}\n`;
    }

    return rules;
  }


  private static generateMoveFormatPrompt(moveFormat: { type: string; examples: string[] }): string {

    if (moveFormat.examples.length > 0) {
      return `MOVE FORMAT: Use the exact format shown in the examples
Examples: ${moveFormat.examples.join(', ')}

Important: Respond with ONLY the move string, exactly as shown in the examples.`;
    }

    return `MOVE FORMAT: Use the exact format from the valid moves list provided
Respond with ONLY the move string, nothing else.`;
  }


  private static generateStrategicHints(_gameType: string, metadata: GameMetadata): string[] {

    if (metadata.aiPrompts?.strategicHints && metadata.aiPrompts.strategicHints.length > 0) {
      return metadata.aiPrompts.strategicHints;
    }


    const hints = [
      'Choose moves that improve your position',
      'Think about your opponent\'s possible responses',
      'Consider both offensive and defensive options',
      'Look for opportunities to gain an advantage'
    ];

    return hints;
  }


  private static generateMoveExamples(
    moveFormat: { type: string; examples: string[] },
    validMoves?: Move[]
  ): string[] {
    if (moveFormat.examples.length > 0) {
      return moveFormat.examples.slice(0, 3);
    }



    return validMoves?.slice(0, 3).map(move =>
      typeof move.data === 'string' ? move.data : JSON.stringify(move.data)
    ) || ['move1', 'move2', 'move3'];
  }


  private static generateStateDescriptionPrompt(sampleBoardDisplay?: string): string {
    if (sampleBoardDisplay) {
      return 'The current game state is shown below with the board layout and game information:';
    }
    return 'The current game state shows the board position and whose turn it is to move:';
  }


  static validateTemplate(template: GeneratedPromptTemplate): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.systemPrompt || template.systemPrompt.length < 10) {
      errors.push('System prompt is too short or missing');
    }

    if (!template.moveFormatPrompt || template.moveFormatPrompt.length < 10) {
      errors.push('Move format prompt is too short or missing');
    }

    if (!template.moveExamples || template.moveExamples.length === 0) {
      errors.push('Move examples are missing');
    }

    if (template.systemPrompt && template.systemPrompt.length > 1000) {
      errors.push('System prompt is too long (>1000 chars)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
