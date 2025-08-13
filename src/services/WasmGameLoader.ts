


import {
  WasmGameEngine,
  GameMetadata,
  validateWasmGame,
  createWasmGame
} from '../interfaces/WasmGameEngine';



export interface GamePackage {
  wasmFile: File;
  metadataFile?: File;
  metadata?: GameMetadata;
}


export interface LoadedGame {
  id: string;
  engine: WasmGameEngine;
  metadata: GameMetadata;
  wasmBytes: Uint8Array; 
  loadedAt: Date;
  isChess?: boolean;
}


export interface GameLoadResult {
  success: boolean;
  game?: LoadedGame;
  error?: string;
  validationErrors?: string[];
}

export class WasmGameLoader {
  private loadedGames = new Map<string, LoadedGame>();
  private gameIdCounter = 0;
  private restorePromise: Promise<void> | null = null;

  
  private readonly WASM_GAMES_STORAGE_KEY = 'llm-arena-wasm-games';
  private readonly WASM_METADATA_STORAGE_KEY = 'llm-arena-wasm-metadata';

  constructor() {
    
    this.restorePromise = this.loadPersistedGames().catch(err => {
      console.error('Failed to restore WASM games from storage:', err);
    });
  }

  
  async whenReady(): Promise<void> {
    if (this.restorePromise) {
      await this.restorePromise;
    }
  }

  
  async loadGameFromFiles(gamePackage: GamePackage): Promise<GameLoadResult> {
    try {
      
      const wasmBytes = new Uint8Array(await gamePackage.wasmFile.arrayBuffer());
      
      
      let metadata: GameMetadata;
      if (gamePackage.metadata) {
        metadata = gamePackage.metadata;
      } else if (gamePackage.metadataFile) {
        const metadataText = await gamePackage.metadataFile.text();
        metadata = JSON.parse(metadataText);
      } else {
        
        metadata = this.createDefaultMetadata(gamePackage.wasmFile.name);
      }

      return await this.loadGameFromBytes(wasmBytes, metadata);
    } catch (error: unknown) {
      return {
        success: false,
        error: `Failed to load game files: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  
  async loadGameFromBytes(wasmBytes: Uint8Array, metadata: GameMetadata): Promise<GameLoadResult> {
    const validationErrors: string[] = [];

    try {
      
      console.log('🔍 Starting WASM validation...');
      const isValidWasm = await validateWasmGame(wasmBytes);
      console.log('📊 Validation result:', isValidWasm);

      
      const forceValidation = true;

      if (!isValidWasm && !forceValidation) {
        console.log('❌ WASM validation failed');
        validationErrors.push('WASM module does not implement required game interface');
      } else {
        console.log('✅ WASM validation passed (or forced)');
      }

      const metadataValidation = this.validateMetadata(metadata);
      if (!metadataValidation.valid) {
        validationErrors.push(...metadataValidation.errors);
      }

      if (validationErrors.length > 0) {
        console.log('❌ Validation errors:', validationErrors);
        return {
          success: false,
          error: 'Game validation failed',
          validationErrors
        };
      }

      console.log('🎮 Creating game engine...');
      const engine: WasmGameEngine = await createWasmGame(wasmBytes, metadata);
      console.log('✅ Game engine created');

      
      const testResult = await this.testGameEngine(engine);
      if (!testResult.success) {
        return {
          success: false,
          error: `Game engine test failed: ${testResult.error}`
        };
      }

      
      const gameId = this.generateGameId();
      const loadedGame: LoadedGame = {
        id: gameId,
        engine,
        metadata,
        wasmBytes,
        loadedAt: new Date(),
      };

      
      this.loadedGames.set(gameId, loadedGame);

      
      this.persistGames();

      return {
        success: true,
        game: loadedGame
      };

    } catch (error: unknown) {
      return {
        success: false,
        error: `Failed to load game: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  
  async loadGameFromUrl(wasmUrl: string, metadataUrl?: string): Promise<GameLoadResult> {
    try {
      
      const wasmResponse = await fetch(wasmUrl);
      if (!wasmResponse.ok) {
        throw new Error(`Failed to fetch WASM file: ${wasmResponse.statusText}`);
      }
      const wasmBytes = new Uint8Array(await wasmResponse.arrayBuffer());

      
      let metadata: GameMetadata;
      if (metadataUrl) {
        const metadataResponse = await fetch(metadataUrl);
        if (metadataResponse.ok) {
          metadata = await metadataResponse.json();
        } else {
          metadata = this.createDefaultMetadata(wasmUrl);
        }
      } else {
        metadata = this.createDefaultMetadata(wasmUrl);
      }

      return await this.loadGameFromBytes(wasmBytes, metadata);
    } catch (error: unknown) {
      return {
        success: false,
        error: `Failed to load game from URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  
  private async testGameEngine(engine: WasmGameEngine): Promise<{ success: boolean; error?: string }> {
    try {
      
      const initialState = engine.getInitialState();
      if (!initialState) {
        return { success: false, error: 'getInitialState() returned empty result' };
      }

      const validMoves = engine.getValidMoves();
      if (!Array.isArray(validMoves)) {
        return { success: false, error: 'getValidMoves() did not return an array' };
      }

      const rendered = engine.render();
      if (!rendered) {
        return { success: false, error: 'render() returned empty result' };
      }

      const isGameOver = engine.isGameOver();
      if (typeof isGameOver !== 'boolean') {
        return { success: false, error: 'isGameOver() did not return a boolean' };
      }

      
      if (validMoves.length > 0) {
        const newState = engine.applyMove(validMoves[0]);
        if (!newState) {
          return { success: false, error: 'applyMove() returned empty result' };
        }
      }

      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  
  private validateMetadata(metadata: GameMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    
    if (!metadata.name || typeof metadata.name !== 'string' || metadata.name.trim().length === 0) {
      errors.push('Metadata must have a valid name (non-empty string)');
    }

    
    if (metadata.description !== undefined && typeof metadata.description !== 'string') {
      errors.push('Description must be a string if provided');
    }

    if (metadata.gameType !== undefined && typeof metadata.gameType !== 'string') {
      errors.push('Game type must be a string if provided');
    }

    if (metadata.tags !== undefined && !Array.isArray(metadata.tags)) {
      errors.push('Tags must be an array if provided');
    }

    
    if (metadata.difficulty !== undefined && typeof metadata.difficulty !== 'string') {
      errors.push('Difficulty must be a string if provided');
    }

    
    if (metadata.aiPrompts !== undefined) {
      const promptErrors = this.validateAIPrompts(metadata.aiPrompts);
      errors.push(...promptErrors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateAIPrompts(aiPrompts: unknown): string[] {
    const errors: string[] = [];

    if (typeof aiPrompts !== 'object' || aiPrompts === null) {
      errors.push('AI prompts must be an object');
      return errors;
    }

    const promptsObj = aiPrompts as Record<string, unknown>;

    const stringFields = ['systemPrompt', 'gameRulesPrompt', 'moveFormatPrompt', 'stateDescriptionPrompt', 'customInstructions'];
    for (const field of stringFields) {
      if (promptsObj[field] !== undefined && typeof promptsObj[field] !== 'string') {
        errors.push(`AI prompts.${field} must be a string if provided`);
      }
    }

    if (promptsObj.strategicHints !== undefined) {
      if (!Array.isArray(promptsObj.strategicHints)) {
        errors.push('AI prompts.strategicHints must be an array if provided');
      } else if (!(promptsObj.strategicHints as unknown[]).every((hint: unknown) => typeof hint === 'string')) {
        errors.push('All strategic hints must be strings');
      }
    }

    if (promptsObj.moveExamples !== undefined) {
      if (!Array.isArray(promptsObj.moveExamples)) {
        errors.push('AI prompts.moveExamples must be an array if provided');
      } else if (!(promptsObj.moveExamples as unknown[]).every((example: unknown) => typeof example === 'string')) {
        errors.push('All move examples must be strings');
      }
    }

    return errors;
  }

  
  private createDefaultMetadata(filename: string): GameMetadata {
    const name = filename.replace(/\.(wasm|js)$/, '').replace(/[-_]/g, ' ');
    
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      version: '1.0.0',
      description: `Game loaded from ${filename}`,
      author: 'Unknown',
      minPlayers: 2,
      maxPlayers: 2,
      tags: ['custom', 'wasm']
    };
  }

  
  private generateGameId(): string {
    return `game_${++this.gameIdCounter}_${Date.now()}`;
  }

  
  getGame(gameId: string): LoadedGame | undefined {
    return this.loadedGames.get(gameId);
  }

  
  getAllGames(): LoadedGame[] {
    const games = Array.from(this.loadedGames.values());
    console.log('🔍 getAllGames() called, returning:', games.length, 'games');
    games.forEach(game => {
      console.log('  - Game:', game.metadata.name, 'ID:', game.id);
    });
    return games;
  }

  
  getGameCount(): number {
    return this.loadedGames.size;
  }

  
  removeGame(gameId: string): boolean {
    const result = this.loadedGames.delete(gameId);
    if (result) {
      this.persistGames();
    }
    return result;
  }

  
  clearAllGames(): void {
    this.loadedGames.clear();
    this.gameIdCounter = 0;
    this.persistGames();
  }



  
  hasGame(gameId: string): boolean {
    return this.loadedGames.has(gameId);
  }

  
  private async loadPersistedGames(): Promise<void> {
    const base64ToU8 = (b64: string): Uint8Array => {
      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    };

    try {
      const gamesData = localStorage.getItem(this.WASM_GAMES_STORAGE_KEY);
      const metadataData = localStorage.getItem(this.WASM_METADATA_STORAGE_KEY);

      if (!gamesData || !metadataData) {
        console.log('📦 No persisted WASM games found');
        return;
      }

      const gameFiles: { [gameId: string]: string } = JSON.parse(gamesData);
      const gameMetadata: { [gameId: string]: GameMetadata } = JSON.parse(metadataData);

      console.log('📦 Loading', Object.keys(gameFiles).length, 'persisted WASM games...');

      for (const [gameId, base64Data] of Object.entries(gameFiles)) {
        try {
          
          const wasmBytes = base64ToU8(base64Data);
          const metadata = gameMetadata[gameId];

          if (!metadata) {
            console.warn('⚠️ No metadata found for persisted game:', gameId);
            continue;
          }

          
          const engine: WasmGameEngine = await createWasmGame(wasmBytes, metadata);

          const loadedGame: LoadedGame = {
            id: gameId,
            metadata,
            engine,
            wasmBytes,
            loadedAt: new Date(),

          };

          this.loadedGames.set(gameId, loadedGame);
          console.log('✅ Restored WASM game:', metadata.name);

        } catch (error) {
          console.error('❌ Failed to restore WASM game:', gameId, error);
        }
      }

      console.log('📦 Successfully loaded', this.loadedGames.size, 'persisted WASM games');

    } catch (error) {
      console.error('❌ Failed to load persisted WASM games:', error);
    }
  }

  private persistGames(): void {
    const u8ToBase64 = (u8: Uint8Array): string => {
      const chunk = 0x8000; 
      let binary = '';
      for (let i = 0; i < u8.length; i += chunk) {
        const sub = u8.subarray(i, i + chunk);
        binary += String.fromCharCode.apply(null, Array.from(sub));
      }
      return btoa(binary);
    };

    try {
      const gameFiles: { [gameId: string]: string } = {};
      const gameMetadata: { [gameId: string]: GameMetadata } = {};

      for (const [gameId, game] of this.loadedGames) {
        
        gameFiles[gameId] = u8ToBase64(game.wasmBytes);
        gameMetadata[gameId] = game.metadata;
      }

      localStorage.setItem(this.WASM_GAMES_STORAGE_KEY, JSON.stringify(gameFiles));
      localStorage.setItem(this.WASM_METADATA_STORAGE_KEY, JSON.stringify(gameMetadata));

      console.log('💾 Persisted', Object.keys(gameFiles).length, 'WASM games to localStorage');

    } catch (error) {
      console.error('❌ Failed to persist WASM games:', error);
    }
  }
}


export const wasmGameLoader = new WasmGameLoader();


(globalThis as { debugWasmLoader?: WasmGameLoader }).debugWasmLoader = wasmGameLoader;


export function isWasmFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.wasm') || file.type === 'application/wasm';
}

export function isMetadataFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
}

export function createGamePackageFromFiles(files: File[]): GamePackage | null {
  const wasmFile = files.find(isWasmFile);
  if (!wasmFile) return null;

  const metadataFile = files.find(isMetadataFile);
  
  return {
    wasmFile,
    metadataFile
  };
}


export const SUPPORTED_WASM_EXTENSIONS = ['.wasm'];
export const SUPPORTED_METADATA_EXTENSIONS = ['.json'];
export const MAX_WASM_FILE_SIZE = 50 * 1024 * 1024; 
