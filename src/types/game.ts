export type PlayerId = 'player1' | 'player2';
export type GameResult = 'win' | 'loss' | 'draw' | 'ongoing';

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  playerId: PlayerId;
  position?: Position;
  data?: any; 
  timestamp: number;
}

export interface GameState {
  board?: any; 
  currentPlayer: PlayerId;
  moves: Move[];
  result: GameResult;
  winner?: PlayerId;
  metadata?: Record<string, any>;
}

export interface GameEngine {
  readonly name: string;
  readonly description: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;

  getInitialState(): GameState;
  getValidMoves(state: GameState): Move[];
  applyMove(state: GameState, move: Move): GameState;
  isGameOver(state: GameState): boolean;
  getWinner(state: GameState): PlayerId | null;
  getCurrentPlayer(state: GameState): PlayerId;
  serializeState(state: GameState): string;
  deserializeState(serialized: string): GameState;
  validateMove(state: GameState, move: Move): boolean;
  getBoardDisplay(state: GameState): string;
}


export interface AsyncGameEngine extends GameEngine {
  
  getInitialStateAsync?(): Promise<GameState>;
  getValidMovesAsync?(state: GameState): Promise<Move[]>;
  applyMoveAsync?(state: GameState, move: Move): Promise<GameState>;
  isGameOverAsync?(state: GameState): Promise<boolean>;
  getWinnerAsync?(state: GameState): Promise<PlayerId | null>;
  getCurrentPlayerAsync?(state: GameState): Promise<PlayerId>;
  validateMoveAsync?(state: GameState, move: Move): Promise<boolean>;
  getBoardDisplayAsync?(state: GameState): Promise<string>;
}

export interface GameConfig {
  engine: GameEngine;
  player1: AgentConfig;
  player2: AgentConfig;
  settings?: Record<string, any>;
}

export interface AgentConfig {
  type: 'human' | 'llm' | 'empty';
  name: string;
  providerId?: string; 
  settings?: Record<string, any>;
}

export interface MatchResult {
  gameConfig: GameConfig;
  finalState: GameState;
  duration: number;
  moveCount: number;
  transcript: string[];
}
