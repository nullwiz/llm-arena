import type { GameState, Move, PlayerId } from './game';

export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly type: 'human' | 'llm' | 'empty';

  getMove(state: GameState, playerId: PlayerId): Promise<Move>;
  onGameStart?(state: GameState, playerId: PlayerId): Promise<void>;
  onGameEnd?(state: GameState, result: string): Promise<void>;
  onOpponentMove?(state: GameState, move: Move): Promise<void>;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'ollama' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeout?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  timestamp: number;
}

export interface PromptTemplate {
  system: string;
  gameRules: string;
  stateDescription: string;
  moveFormat: string;
  examples: string[];
}

export interface AgentSettings {
  llm?: LLMConfig;
  ruleBasedStrategy?: string;
  humanTimeout?: number;
  [key: string]: any;
}
