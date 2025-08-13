import { GameEngine, AsyncGameEngine, GameState, Move, PlayerId, Agent, MatchResult, GameConfig } from '@/types';

export interface MatchControllerEvents {
  onStateChange: (state: GameState) => void;
  onMoveAttempt: (move: Move, valid: boolean) => void;
  onGameEnd: (result: MatchResult) => void;
  onError: (error: Error) => void;
}

export class MatchController {
  private gameEngine: GameEngine | AsyncGameEngine;
  private agents: Map<PlayerId, Agent>;
  private currentState: GameState;
  private startTime: number;
  private transcript: string[] = [];
  private events: Partial<MatchControllerEvents> = {};
  private agentsStarted: Set<PlayerId> = new Set();
  private isRunning: boolean = false;

  constructor(config: GameConfig, events?: Partial<MatchControllerEvents>) {
    this.gameEngine = config.engine;
    this.agents = new Map();
    this.currentState = this.gameEngine.getInitialState();
    this.startTime = Date.now();
    this.events = events || {};
  }

  
  private async getValidMovesAsync(state: GameState): Promise<Move[]> {
    const asyncEngine = this.gameEngine as AsyncGameEngine;
    if (asyncEngine.getValidMovesAsync) {
      return await asyncEngine.getValidMovesAsync(state);
    }
    return this.gameEngine.getValidMoves(state);
  }

  private async validateMoveAsync(state: GameState, move: Move): Promise<boolean> {
    const asyncEngine = this.gameEngine as AsyncGameEngine;
    if (asyncEngine.validateMoveAsync) {
      return await asyncEngine.validateMoveAsync(state, move);
    }
    return this.gameEngine.validateMove(state, move);
  }

  private async applyMoveAsync(state: GameState, move: Move): Promise<GameState> {
    const asyncEngine = this.gameEngine as AsyncGameEngine;
    if (asyncEngine.applyMoveAsync) {
      return await asyncEngine.applyMoveAsync(state, move);
    }
    return this.gameEngine.applyMove(state, move);
  }

  private async isGameOverAsync(state: GameState): Promise<boolean> {
    const asyncEngine = this.gameEngine as AsyncGameEngine;
    if (asyncEngine.isGameOverAsync) {
      return await asyncEngine.isGameOverAsync(state);
    }
    return this.gameEngine.isGameOver(state);
  }

  private async getBoardDisplayAsync(state: GameState): Promise<string> {
    const asyncEngine = this.gameEngine as AsyncGameEngine;
    if (asyncEngine.getBoardDisplayAsync) {
      return await asyncEngine.getBoardDisplayAsync(state);
    }
    return this.gameEngine.getBoardDisplay(state);
  }

  private async getCurrentPlayerAsync(): Promise<PlayerId> {
    const asyncEngine = this.gameEngine as AsyncGameEngine;
    if (asyncEngine.getCurrentPlayerAsync) {
      return await asyncEngine.getCurrentPlayerAsync(this.currentState);
    }
    return this.gameEngine.getCurrentPlayer(this.currentState);
  }

  setAgent(playerId: PlayerId, agent: Agent): void {
    this.agents.set(playerId, agent);
  }

  getCurrentState(): GameState {
    return { ...this.currentState };
  }

  async startMatch(): Promise<void> {
    if (this.isRunning) {
      console.warn('MatchController: startMatch called but match is already running');
      return;
    }

    this.isRunning = true;

    try {
      this.addToTranscript(`Game started: ${this.gameEngine.name}`);
      const boardDisplay = await this.getBoardDisplayAsync(this.currentState);
      this.addToTranscript(`Board:\n${boardDisplay}`);

      this.events.onStateChange?.(this.currentState);

      await this.gameLoop();
    } catch (error) {
      this.events.onError?.(error as Error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async gameLoop(): Promise<void> {
    while (!(await this.isGameOverAsync(this.currentState))) {
      const currentPlayer = await this.getCurrentPlayerAsync();
      const agent = this.agents.get(currentPlayer);

      if (!agent) {
        throw new Error(`No agent found for player ${currentPlayer}`);
      }

      if (!this.agentsStarted.has(currentPlayer) && agent.onGameStart) {
        await agent.onGameStart(this.currentState, currentPlayer);
        this.agentsStarted.add(currentPlayer);
      }

      try {
        this.addToTranscript(`\n--- ${agent.name}'s turn (${currentPlayer}) ---`);

        const move = await agent.getMove(this.currentState, currentPlayer);

        if (await this.validateMoveAsync(this.currentState, move)) {
          this.currentState = await this.applyMoveAsync(this.currentState, move);

          this.addToTranscript(`Move: ${JSON.stringify(move.position || move.data)}`);
          const boardDisplay = await this.getBoardDisplayAsync(this.currentState);
          this.addToTranscript(`Board:\n${boardDisplay}`);

          this.events.onMoveAttempt?.(move, true);
          this.events.onStateChange?.(this.currentState);

          for (const [playerId, otherAgent] of this.agents) {
            if (playerId !== currentPlayer && otherAgent.onOpponentMove) {
              await otherAgent.onOpponentMove(this.currentState, move);
            }
          }
        } else {
          this.addToTranscript(`Invalid move attempted: ${JSON.stringify(move.position || move.data)}`);
          this.events.onMoveAttempt?.(move, false);
          continue;
        }
      } catch (error) {
        this.addToTranscript(`Error during ${agent.name}'s turn: ${error}`);
        this.events.onError?.(error as Error);
        return;
      }
    }
    await this.endMatch();
  }

  private async endMatch(): Promise<void> {
    const winner = this.gameEngine.getWinner(this.currentState);
    const duration = Date.now() - this.startTime;
    
    this.addToTranscript(`\n--- Game Over ---`);
    if (winner) {
      const winnerAgent = this.agents.get(winner);
      this.addToTranscript(`Winner: ${winnerAgent?.name} (${winner})`);
    } else {
      this.addToTranscript(`Result: Draw`);
    }

    const result: MatchResult = {
      gameConfig: {
        engine: this.gameEngine,
        player1: { type: this.agents.get('player1')?.type || 'empty', name: this.agents.get('player1')?.name || 'Unknown' },
        player2: { type: this.agents.get('player2')?.type || 'empty', name: this.agents.get('player2')?.name || 'Unknown' }
      },
      finalState: this.currentState,
      duration,
      moveCount: this.currentState.moves.length,
      transcript: [...this.transcript]
    };

    
    for (const [playerId, agent] of this.agents) {
      if (agent.onGameEnd) {
        const playerResult = winner === playerId ? 'win' : winner === null ? 'draw' : 'loss';
        await agent.onGameEnd(this.currentState, playerResult);
      }
    }

    this.events.onGameEnd?.(result);
  }

  private addToTranscript(message: string): void {
    this.transcript.push(`[${new Date().toISOString()}] ${message}`);
  }

  async makeMove(move: Move): Promise<boolean> {
    if (await this.validateMoveAsync(this.currentState, move)) {
      this.currentState = await this.applyMoveAsync(this.currentState, move);
      this.events.onStateChange?.(this.currentState);
      return true;
    }
    return false;
  }

  getTranscript(): string[] {
    return [...this.transcript];
  }
}
