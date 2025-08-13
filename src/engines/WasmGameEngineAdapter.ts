


import { GameEngine, GameState, Move, PlayerId, GameResult } from '../types/game';
import { WasmGameEngine } from '../interfaces/WasmGameEngine';
import { LoadedGame } from '../services/WasmGameLoader';

export class WasmGameEngineAdapter implements GameEngine {
  public readonly name: string;
  public readonly description: string;
  public readonly minPlayers: number;
  public readonly maxPlayers: number;

  private wasmEngine: WasmGameEngine;
  private loadedGame: LoadedGame;

  constructor(loadedGame: LoadedGame) {
    this.loadedGame = loadedGame;
    this.wasmEngine = loadedGame.engine;

    
    const metadata = loadedGame.metadata;
    this.name = metadata.name;
    this.description = metadata.description || `${metadata.name} - A WASM game${metadata.author ? ` by ${metadata.author}` : ''}`;
    this.minPlayers = metadata.minPlayers || 2;
    this.maxPlayers = metadata.maxPlayers || 2;

    console.log(`🎮 WasmGameEngineAdapter: Created adapter for "${metadata.name}" by ${metadata.author}`);
    if (metadata.aiPrompts) {
      console.log(`✨ WasmGameEngineAdapter: Custom AI prompts available for ${metadata.name}`);
    }
  }

  
  get metadata() {
    return this.loadedGame.metadata;
  }

  private mapWasmPlayerToSystemPlayer(wasmPlayer: string): PlayerId {
    
    if (wasmPlayer === 'player1') return 'player1';
    if (wasmPlayer === 'player2') return 'player2';

    throw new Error(`WASM implementation error: expected "player1" or "player2", got "${wasmPlayer}"`);
  }



  getInitialState(): GameState {
    const wasmState = this.wasmEngine.getInitialState();
    const wasmCurrentPlayer = this.wasmEngine.getCurrentPlayer?.();

    if (!wasmCurrentPlayer) {
      throw new Error('WASM engine getCurrentPlayer() returned null/undefined');
    }

    const currentPlayer = this.mapWasmPlayerToSystemPlayer(wasmCurrentPlayer);

    return {
      board: wasmState,
      currentPlayer,
      moves: [],
      result: 'ongoing',
      metadata: {
        gameId: this.loadedGame.id,
        gameName: this.loadedGame.metadata.name,
        gameType: this.loadedGame.metadata.gameType
      }
    };
  }

  getValidMoves(): Move[] {

    const validMoves = this.wasmEngine.getValidMoves();
    const wasmCurrentPlayer = this.wasmEngine.getCurrentPlayer?.();

    if (!wasmCurrentPlayer) {
      throw new Error('WASM engine getCurrentPlayer() returned null/undefined');
    }

    const currentPlayer = this.mapWasmPlayerToSystemPlayer(wasmCurrentPlayer);

    console.log(`🎮 WasmAdapter: Getting valid moves for ${this.name}`);
    console.log(`🎮 WasmAdapter: WASM current player: "${wasmCurrentPlayer}" -> System player: "${currentPlayer}"`);
    console.log(`🎮 WasmAdapter: Valid moves count: ${validMoves.length}`);
    console.log(`🎮 WasmAdapter: First few moves:`, validMoves.slice(0, 5));

    return validMoves.map((moveStr, index) => ({
      playerId: currentPlayer,
      data: moveStr,
      timestamp: Date.now() + index
    }));
  }

  applyMove(state: GameState, move: Move): GameState {
    const moveStr = move.data as string;

    if (typeof moveStr !== 'string') {
      throw new Error(`Move data must be a string, got ${typeof moveStr}`);
    }

    
    const newWasmState = this.wasmEngine.applyMove(moveStr);

    
    if (newWasmState.startsWith('ERROR:')) {
      throw new Error(`WASM apply_move failed: ${newWasmState}`);
    }

    
    const isGameOver = this.wasmEngine.isGameOver();
    const winner = isGameOver ? this.wasmEngine.getWinner() : null;
    const currentPlayer = this.wasmEngine.getCurrentPlayer?.();

    if (!currentPlayer) {
      throw new Error('WASM engine getCurrentPlayer() returned null/undefined after move');
    }

    const mappedCurrentPlayer = this.mapWasmPlayerToSystemPlayer(currentPlayer);

    
    let result: GameResult = 'ongoing';
    let mappedWinner: PlayerId | undefined = undefined;

    if (isGameOver) {
      if (winner === 'draw') {
        result = 'draw';
      } else if (winner) {
        result = 'win';
        mappedWinner = this.mapWasmPlayerToSystemPlayer(winner);
      } else {
        result = 'draw';
      }
    }

    
    return {
      board: newWasmState,
      currentPlayer: mappedCurrentPlayer, 
      moves: [...state.moves, move],
      result,
      winner: mappedWinner,
      metadata: state.metadata
    };
  }



  validateMove(_state: GameState, move: Move): boolean {

    const validMoves = this.wasmEngine.getValidMoves();
    const wasmCurrentPlayer = this.wasmEngine.getCurrentPlayer?.();

    if (typeof move.data !== 'string') {
      throw new Error(`Move data must be a string, got ${typeof move.data}`);
    }

    
    const expectedWasmPlayer = move.playerId === 'player1' ? 'player1' : 'player2';
    if (wasmCurrentPlayer !== expectedWasmPlayer) {
      return false;
    }

    return validMoves.includes(move.data);
  }

  isGameOver(): boolean {
    return this.wasmEngine.isGameOver();
  }

  getWinner(state: GameState): PlayerId | null {
    
    if (state.result === 'draw') {
      return null;
    }

    const winner = this.wasmEngine.getWinner();

    if (winner === 'draw' || !winner) {
      return null;
    }

    return this.mapWasmPlayerToSystemPlayer(winner);
  }

  getCurrentPlayer(): PlayerId {
    const wasmCurrentPlayer = this.wasmEngine.getCurrentPlayer?.();

    if (!wasmCurrentPlayer) {
      throw new Error('WASM engine getCurrentPlayer() returned null/undefined');
    }

    return this.mapWasmPlayerToSystemPlayer(wasmCurrentPlayer);
  }

  getBoardDisplay(): string {
    return this.wasmEngine.render();
  }

  serializeState(state: GameState): string {
    return JSON.stringify({
      ...state,
      metadata: {
        ...state.metadata,
        wasmState: state.metadata?.wasmState || state.board
      }
    });
  }

  deserializeState(serialized: string): GameState {
    const state = JSON.parse(serialized);

    if (!state.metadata?.wasmState && !state.board) {
      throw new Error('Cannot deserialize state without WASM state data');
    }

    return state;
  }

  
  getWasmEngine(): WasmGameEngine {
    return this.wasmEngine;
  }

  getLoadedGame(): LoadedGame {
    return this.loadedGame;
  }

  
  createMoveFromWasmString(moveStr: string, playerId: PlayerId): Move {
    return {
      playerId,
      data: moveStr,
      timestamp: Date.now()
    };
  }

  
  getWasmState(state: GameState): string {
    return (state.metadata?.wasmState as string) || (state.board as string);
  }

  
  getMetadata() {
    return this.loadedGame.metadata;
  }
}


export function createWasmGameEngineAdapter(loadedGame: LoadedGame): WasmGameEngineAdapter {
  return new WasmGameEngineAdapter(loadedGame);
}


export class WasmGameRegistry {
  private adapters = new Map<string, WasmGameEngineAdapter>();

  registerGame(loadedGame: LoadedGame): WasmGameEngineAdapter {
    const adapter = new WasmGameEngineAdapter(loadedGame);
    this.adapters.set(loadedGame.id, adapter);
    return adapter;
  }

  getAdapter(gameId: string): WasmGameEngineAdapter | undefined {
    return this.adapters.get(gameId);
  }

  getAllAdapters(): WasmGameEngineAdapter[] {
    return Array.from(this.adapters.values());
  }

  removeGame(gameId: string): boolean {
    return this.adapters.delete(gameId);
  }

  clear(): void {
    this.adapters.clear();
  }
}


export const wasmGameRegistry = new WasmGameRegistry();
