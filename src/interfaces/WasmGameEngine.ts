
export interface WasmGameEngine {
  getInitialState(): string;
  getValidMoves(): string[];
  applyMove(move: string): string;
  isGameOver(): boolean;
  getWinner(): "player1" | "player2" | "draw" | null;
  render(): string;

  getGameName?(): string;
  getCurrentPlayer?(): "player1" | "player2";
  getGameDescription?(): string;
  getMoveNotation?(move: string): string;
  logTranscript?(): string;
}


export interface WasmGameExports {
  memory: WebAssembly.Memory;
  malloc?: (size: number) => number;
  free?: (ptr: number) => void;
  get_initial_state: () => number;
  get_valid_moves: (statePtr: number) => number;
  apply_move: (statePtr: number, movePtr: number) => number;
  is_game_over: (statePtr: number) => number;
  get_winner: (statePtr: number) => number;
  render: (statePtr: number) => number;
  get_game_name?: () => number;
  get_current_player?: (statePtr: number) => number;
  get_game_description?: () => number;
  get_move_notation?: (movePtr: number) => number;
  log_transcript?: (statePtr: number) => number;
}


export interface AIPromptTemplate {
  systemPrompt?: string;
  gameRulesPrompt?: string;
  moveFormatPrompt?: string;
  strategicHints?: string[];
  moveExamples?: string[];
  stateDescriptionPrompt?: string;
  customInstructions?: string;
}


export interface GameMetadata {
  name: string; 
  version?: string;
  description?: string;
  author?: string;
  gameType?: string; 
  minPlayers?: number;
  maxPlayers?: number;
  estimatedPlayTime?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  aiPrompts?: AIPromptTemplate; 
}


export class WasmGameWrapper implements WasmGameEngine {
  private wasmInstance: WebAssembly.Instance | null = null;
  protected exports: WasmGameExports | null = null;
  private metadata: GameMetadata;
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();
  private currentState: string = "";

  constructor(metadata: GameMetadata) {
    this.metadata = metadata;
  }

  async initialize(wasmBytes: Uint8Array): Promise<boolean> {
    try {
      const importObject = {
        env: {}
      };

      const wasmModule = await WebAssembly.compile(wasmBytes);
      this.wasmInstance = await WebAssembly.instantiate(wasmModule, importObject);
      this.exports = this.wasmInstance.exports as unknown as WasmGameExports;

      return this.validateExports();
    } catch (error) {
      console.error('Failed to initialize WASM game:', error);
      return false;
    }
  }

  private validateExports(): boolean {
    if (!this.exports) return false;

    const requiredFunctions = [
      'get_initial_state',
      'get_valid_moves',
      'apply_move',
      'is_game_over',
      'get_winner',
      'render'
    ];

    return requiredFunctions.every(fn => fn in this.exports!);
  }

  protected writeStringToWasm(str: string): number {
    if (!this.exports?.memory) {
      throw new Error('WASM memory not available');
    }

    const bytes = this.textEncoder.encode(str + '\0');

    
    if (this.exports.malloc) {
      const ptr = this.exports.malloc(bytes.length);
      const memory = new Uint8Array(this.exports.memory.buffer);
      memory.set(bytes, ptr);
      return ptr;
    }

    const neededBytes = bytes.length;
    const neededPages = Math.ceil(neededBytes / 65536);

    if (neededPages > 0) {
      this.exports.memory.grow(neededPages);
    }

    const memory = new Uint8Array(this.exports.memory.buffer);
    const ptr = memory.length - neededBytes;
    memory.set(bytes, ptr);
    return ptr;
  }

  protected readStringFromWasm(ptr: number): string {
    if (!this.exports?.memory) {
      throw new Error('WASM memory not available');
    }

    const memory = new Uint8Array(this.exports.memory.buffer);
    let length = 0;

    
    while (ptr + length < memory.length && memory[ptr + length] !== 0) {
      length++;
    }

    const bytes = memory.slice(ptr, ptr + length);
    return this.textDecoder.decode(bytes);
  }

  protected freeWasmString(ptr: number): void {
    if (this.exports?.free) {
      this.exports.free(ptr);
    }
    
    
  }

  getInitialState(): string {
    if (!this.exports) throw new Error('WASM not initialized');

    const ptr = this.exports.get_initial_state();
    const state = this.readStringFromWasm(ptr);
    this.freeWasmString(ptr);
    this.currentState = state;
    return state;
  }

  getValidMoves(): string[] {
    if (!this.exports) throw new Error('WASM not initialized');

    const statePtr = this.writeStringToWasm(this.currentState);
    const movesPtr = this.exports.get_valid_moves(statePtr);
    const movesJson = this.readStringFromWasm(movesPtr);

    this.freeWasmString(statePtr);
    this.freeWasmString(movesPtr);

    try {
      return JSON.parse(movesJson);
    } catch {
      return movesJson.split(',').filter(m => m.trim());
    }
  }

  applyMove(move: string): string {
    if (!this.exports) throw new Error('WASM not initialized');

    const statePtr = this.writeStringToWasm(this.currentState);
    const movePtr = this.writeStringToWasm(move);
    const newStatePtr = this.exports.apply_move(statePtr, movePtr);
    const newState = this.readStringFromWasm(newStatePtr);

    this.freeWasmString(statePtr);
    this.freeWasmString(movePtr);
    this.freeWasmString(newStatePtr);

    this.currentState = newState;
    return newState;
  }

  isGameOver(): boolean {
    if (!this.exports) throw new Error('WASM not initialized');

    const statePtr = this.writeStringToWasm(this.currentState);
    const result = this.exports.is_game_over(statePtr);
    this.freeWasmString(statePtr);
    return result === 1;
  }

  getWinner(): "player1" | "player2" | "draw" | null {
    if (!this.exports) throw new Error('WASM not initialized');

    const statePtr = this.writeStringToWasm(this.currentState);
    const winnerPtr = this.exports.get_winner(statePtr);
    const winner = this.readStringFromWasm(winnerPtr);

    this.freeWasmString(statePtr);
    this.freeWasmString(winnerPtr);

    if (winner === 'player1' || winner === 'player2' || winner === 'draw') {
      return winner;
    }
    return null;
  }

  render(): string {
    if (!this.exports) throw new Error('WASM not initialized');

    const statePtr = this.writeStringToWasm(this.currentState);
    const renderPtr = this.exports.render(statePtr);
    const rendered = this.readStringFromWasm(renderPtr);

    this.freeWasmString(statePtr);
    this.freeWasmString(renderPtr);

    return rendered;
  }

  getGameName(): string {
    if (this.exports?.get_game_name) {
      const namePtr = this.exports.get_game_name();
      const name = this.readStringFromWasm(namePtr);
      this.freeWasmString(namePtr);
      return name;
    }
    return this.metadata.name;
  }

  getCurrentPlayer(): "player1" | "player2" {
    if (this.exports?.get_current_player) {
      const statePtr = this.writeStringToWasm(this.currentState);
      const playerPtr = this.exports.get_current_player(statePtr);
      const player = this.readStringFromWasm(playerPtr);

      this.freeWasmString(statePtr);
      this.freeWasmString(playerPtr);

      
      if (player === 'player1') return 'player1';
      if (player === 'player2') return 'player2';

      throw new Error(`WASM implementation error: expected "player1" or "player2", got "${player}"`);
    }

    
    return 'player1';
  }

  getGameDescription(): string {
    if (this.exports?.get_game_description) {
      const descPtr = this.exports.get_game_description();
      const desc = this.readStringFromWasm(descPtr);
      this.freeWasmString(descPtr);
      return desc;
    }
    return this.metadata.description || 'WASM Game';
  }

  getMetadata(): GameMetadata {
    return { ...this.metadata };
  }

  logTranscript?(): string {
    if (!this.exports?.log_transcript) {
      return `Transcript logging not supported by ${this.metadata.name}`;
    }

    const statePtr = this.writeStringToWasm(this.currentState);
    const transcriptPtr = this.exports.log_transcript(statePtr);
    const transcript = this.readStringFromWasm(transcriptPtr);

    this.freeWasmString(statePtr);
    this.freeWasmString(transcriptPtr);

    return transcript;
  }
}


export async function validateWasmGame(wasmBytes: Uint8Array): Promise<boolean> {
  try {
    console.log('🔍 Validating WASM game module...');
    console.log('📊 WASM size:', wasmBytes.length, 'bytes');

    const module = await WebAssembly.compile(wasmBytes);
    console.log('✅ WASM module compiled successfully');

    
    
    const importObject = {
      env: {
        abort: () => { throw new Error('WASM abort called'); },
        __wbindgen_throw: () => {
          throw new Error('WASM throw called');
        }
      },
      wasi_snapshot_preview1: {
        proc_exit: () => {},
        fd_write: () => 0,
        fd_close: () => 0,
        fd_seek: () => 0
      }
    };

    let instance: WebAssembly.Instance;
    try {
      instance = await WebAssembly.instantiate(module, importObject);
      console.log('✅ WASM module instantiated with imports');
    } catch (importError: unknown) {
      console.log('⚠️ Failed with imports, trying without:', importError instanceof Error ? importError.message : 'Unknown error');
      
      instance = await WebAssembly.instantiate(module);
      console.log('✅ WASM module instantiated without imports');
    }

    const exports = instance.exports as Record<string, WebAssembly.ExportValue>;
    console.log('📋 Available exports:', Object.keys(exports));

    const requiredFunctions = [
      'get_initial_state',
      'get_valid_moves',
      'apply_move',
      'is_game_over',
      'get_winner',
      'render'
    ];

    const hasMemory = 'memory' in exports;
    console.log('🧠 Has memory:', hasMemory);

    const missingFunctions: string[] = [];
    const hasRequiredFunctions = requiredFunctions.every(fn => {
      const hasFunction = fn in exports;
      if (!hasFunction) {
        missingFunctions.push(fn);
      } else {
        console.log('✅ Found function:', fn);
      }
      return hasFunction;
    });

    if (missingFunctions.length > 0) {
      console.log('❌ Missing required functions:', missingFunctions);
    }

    const isValid = hasMemory && hasRequiredFunctions;
    console.log('🎯 Validation result:', isValid ? 'PASSED' : 'FAILED');

    return isValid;
  } catch (error) {
    console.error('❌ WASM validation failed:', error);
    return false;
  }
}


export async function createWasmGame(
  wasmBytes: Uint8Array,
  metadata: GameMetadata
): Promise<WasmGameWrapper> {
  const game = new WasmGameWrapper(metadata);
  const success = await game.initialize(wasmBytes);

  if (!success) {
    throw new Error(`Failed to initialize WASM game: ${metadata.name}`);
  }

  return game;
}
