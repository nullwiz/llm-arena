import { Agent, GameState, Move, PlayerId } from '@/types';

export class HumanAgent implements Agent {
  readonly id: string;
  readonly name: string;
  readonly type = 'human' as const;
  
  private moveResolver: ((move: Move) => void) | null = null;
  private moveRejecter: ((error: Error) => void) | null = null;

  constructor(name: string = 'Human Player') {
    this.id = `human-${Date.now()}`;
    this.name = name;
  }

  async getMove(state: GameState, playerId: PlayerId): Promise<Move> {
    return new Promise((resolve, reject) => {
      this.moveResolver = resolve;
      this.moveRejecter = reject;
      
      
      
      setTimeout(() => {
        if (this.moveRejecter) {
          this.moveRejecter(new Error('Move timeout - no move received from human player'));
          this.moveResolver = null;
          this.moveRejecter = null;
        }
      }, 300000); 
    });
  }

  submitMove(move: Partial<Move>, playerId: PlayerId): void {
    if (this.moveResolver) {
      const fullMove: Move = {
        playerId,
        position: move.position,
        data: move.data,
        timestamp: Date.now()
      };
      
      this.moveResolver(fullMove);
      this.moveResolver = null;
      this.moveRejecter = null;
    }
  }

  cancelMove(): void {
    if (this.moveRejecter) {
      this.moveRejecter(new Error('Move cancelled by user'));
      this.moveResolver = null;
      this.moveRejecter = null;
    }
  }

  isWaitingForMove(): boolean {
    return this.moveResolver !== null;
  }

  async onGameStart(state: GameState, playerId: PlayerId): Promise<void> {
    console.log(`${this.name} (${playerId}) joined the game`);
  }

  async onGameEnd(state: GameState, result: string): Promise<void> {
    console.log(`Game ended for ${this.name}: ${result}`);
  }

  async onOpponentMove(state: GameState, move: Move): Promise<void> {
    console.log(`${this.name} observed opponent move:`, move);
  }
}
