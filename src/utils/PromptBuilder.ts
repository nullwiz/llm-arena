import { GameEngine, GameState, Move, PlayerId, PromptTemplate } from '@/types';

export class PromptBuilder {
  private gameEngine: GameEngine;
  private template: PromptTemplate;

  constructor(gameEngine: GameEngine, template?: Partial<PromptTemplate>) {
    this.gameEngine = gameEngine;
    this.template = {
      system: template?.system || this.getDefaultSystemPrompt(),
      gameRules: template?.gameRules || this.getDefaultGameRules(),
      stateDescription: template?.stateDescription || this.getDefaultStateDescription(),
      moveFormat: template?.moveFormat || this.getDefaultMoveFormat(),
      examples: template?.examples || this.getDefaultExamples()
    };
  }

  buildPrompt(state: GameState, playerId: PlayerId): string {
    const validMoves = this.gameEngine.getValidMoves(state);
    const boardDisplay = this.gameEngine.getBoardDisplay(state);
    const moveHistory = this.formatMoveHistory(state.moves);

    return `${this.template.system}

${this.template.gameRules}

CURRENT GAME STATE:
${this.template.stateDescription}

Board:
${boardDisplay}

You are playing as: ${playerId}
Current turn: ${state.currentPlayer}

Move History:
${moveHistory}

Valid moves available: ${validMoves.length}
${this.formatValidMoves(validMoves)}

${this.template.moveFormat}

EXAMPLES:
${this.template.examples.join('\n\n')}

Your move:`;
  }

  private getDefaultSystemPrompt(): string {
    return `You are an AI player in a turn-based game. You must follow the game rules exactly and provide valid moves in the specified format. Always think strategically and try to win the game.`;
  }

  private getDefaultGameRules(): string {
    return `Game: ${this.gameEngine.name}
Description: ${this.gameEngine.description}
Players: ${this.gameEngine.minPlayers}-${this.gameEngine.maxPlayers}`;
  }

  private getDefaultStateDescription(): string {
    return `The game state shows the current board position and whose turn it is to move.`;
  }

  private getDefaultMoveFormat(): string {
    return `Respond with ONLY a JSON object in this format: {"row": number, "col": number}
Do not include any other text, explanations, or formatting.`;
  }

  private getDefaultExamples(): string[] {
    return [
      'Example move: {"row": 0, "col": 1}',
      'Example move: {"row": 2, "col": 0}'
    ];
  }

  private formatMoveHistory(moves: Move[]): string {
    if (moves.length === 0) {
      return 'No moves yet.';
    }

    return moves.map((move, index) => {
      const position = move.position ? `(${move.position.row}, ${move.position.col})` : JSON.stringify(move.data);
      return `${index + 1}. ${move.playerId}: ${position}`;
    }).join('\n');
  }

  private formatValidMoves(moves: Move[]): string {
    if (moves.length === 0) {
      return 'No valid moves available.';
    }

    return moves.slice(0, 10).map(move => {
      const position = move.position ? `(${move.position.row}, ${move.position.col})` : JSON.stringify(move.data);
      return position;
    }).join(', ') + (moves.length > 10 ? '...' : '');
  }

  updateTemplate(updates: Partial<PromptTemplate>): void {
    this.template = { ...this.template, ...updates };
  }

  getTemplate(): PromptTemplate {
    return { ...this.template };
  }

  static createGameSpecificBuilder(gameEngine: GameEngine): PromptBuilder {

    return new PromptBuilder(gameEngine);
  }
}
