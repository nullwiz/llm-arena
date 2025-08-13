export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'ollama' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
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
  finishReason: string;
}

export interface LLMError {
  code: string;
  message: string;
  type: 'auth' | 'rate_limit' | 'network' | 'invalid_request' | 'server_error' | 'timeout';
}

export class LLMService {
  private static instance: LLMService;
  private configs: Map<string, LLMConfig> = new Map();

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  setConfig(providerId: string, config: LLMConfig): void {
    this.configs.set(providerId, config);
    this.saveConfigs();
  }

  getConfig(providerId: string): LLMConfig | null {
    return this.configs.get(providerId) || null;
  }

  getAllConfigs(): Map<string, LLMConfig> {
    return new Map(this.configs);
  }

  removeConfig(providerId: string): void {
    this.configs.delete(providerId);
    this.saveConfigs();
  }

  async callLLM(
    providerId: string,
    prompt: string,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const config = this.configs.get(providerId);
    if (!config) {
      throw new Error(`No configuration found for provider: ${providerId}`);
    }

    const timeout = config.timeout || 30000; 

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let response: Response;

      try {
        switch (config.provider) {
          case 'openai':
            response = await this.callOpenAI(config, prompt, systemPrompt, controller.signal);
            break;
          case 'anthropic':
            response = await this.callAnthropic(config, prompt, systemPrompt, controller.signal);
            break;
          case 'deepseek':
            response = await this.callDeepSeek(config, prompt, systemPrompt, controller.signal);
            break;
          case 'ollama':
            response = await this.callOllama(config, prompt, systemPrompt, controller.signal);
            break;
          case 'custom':
            response = await this.callCustom(config, prompt, systemPrompt, controller.signal);
            break;
          default:
            throw new Error(`Unsupported provider: ${config.provider}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createLLMError(response.status, errorData, config.provider);
      }

      const data = await response.json();
      return this.parseResponse(data, config.provider);

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createLLMError(408, { message: 'Request timeout' }, config.provider);
        }
        if (error.message.includes('Failed to fetch')) {
          throw this.createLLMError(0, { message: 'Network error' }, config.provider);
        }
      }
      throw error;
    }
  }

  private async callOpenAI(
    config: LLMConfig,
    prompt: string,
    systemPrompt?: string,
    signal?: AbortSignal
  ): Promise<Response> {
    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000,
      }),
      signal,
    });
  }

  private async callAnthropic(
    config: LLMConfig,
    prompt: string,
    systemPrompt?: string,
    signal?: AbortSignal
  ): Promise<Response> {
    const baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';

    const messages = [{ role: 'user', content: prompt }];

    return fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        system: systemPrompt,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000,
      }),
      signal,
    });
  }

  private async callDeepSeek(
    config: LLMConfig,
    prompt: string,
    systemPrompt?: string,
    signal?: AbortSignal
  ): Promise<Response> {
    const baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000,
      }),
      signal,
    });
  }

  private async callOllama(
    config: LLMConfig,
    prompt: string,
    systemPrompt?: string,
    signal?: AbortSignal
  ): Promise<Response> {
    const baseUrl = config.baseUrl || 'http://localhost:11434';

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000,
      }),
      signal,
    });
  }

  private async callCustom(
    config: LLMConfig,
    prompt: string,
    systemPrompt?: string,
    signal?: AbortSignal
  ): Promise<Response> {
    if (!config.baseUrl) {
      throw new Error('Custom provider requires baseUrl');
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000,
      }),
      signal,
    });
  }

  private parseResponse(data: unknown, provider: string): LLMResponse {
    const responseData = data as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      model?: string;
    };

    switch (provider) {
      case 'openai':
      case 'deepseek':
      case 'ollama':
      case 'custom':
        return {
          content: responseData.choices?.[0]?.message?.content || '',
          usage: responseData.usage ? {
            promptTokens: responseData.usage.prompt_tokens || 0,
            completionTokens: responseData.usage.completion_tokens || 0,
            totalTokens: responseData.usage.total_tokens || 0,
          } : undefined,
          model: responseData.model || 'unknown',
          finishReason: responseData.choices?.[0]?.finish_reason || 'unknown',
        };

      case 'anthropic': {
        const anthropicData = data as {
          content?: Array<{ text?: string }>;
          usage?: { input_tokens?: number; output_tokens?: number };
          model?: string;
          stop_reason?: string;
        };
        return {
          content: anthropicData.content?.[0]?.text || '',
          usage: anthropicData.usage ? {
            promptTokens: anthropicData.usage.input_tokens || 0,
            completionTokens: anthropicData.usage.output_tokens || 0,
            totalTokens: (anthropicData.usage.input_tokens || 0) + (anthropicData.usage.output_tokens || 0),
          } : undefined,
          model: anthropicData.model || 'unknown',
          finishReason: anthropicData.stop_reason || 'unknown',
        };
      }

      default:
        throw new Error(`Unknown provider for response parsing: ${provider}`);
    }
  }

  private createLLMError(status: number, errorData: unknown, provider: string): LLMError {
    const errorObj = errorData as { message?: string };
    let type: LLMError['type'] = 'server_error';
    let code = `${provider}_error`;
    let message = errorObj.message || 'Unknown error';

    if (status === 401 || status === 403) {
      type = 'auth';
      code = 'invalid_api_key';
      message = 'Invalid API key or insufficient permissions';
    } else if (status === 429) {
      type = 'rate_limit';
      code = 'rate_limit_exceeded';
      message = 'Rate limit exceeded. Please try again later.';
    } else if (status === 400) {
      type = 'invalid_request';
      code = 'invalid_request';
      message = errorObj.message || 'Invalid request parameters';
    } else if (status === 408 || status === 0) {
      type = 'timeout';
      code = 'request_timeout';
      message = 'Request timed out';
    } else if (status >= 500) {
      type = 'server_error';
      code = 'server_error';
      message = 'Server error. Please try again later.';
    }

    return { code, message, type };
  }

  private saveConfigs(): void {
    try {
      const configsArray = Array.from(this.configs.entries()).map(([id, config]) => ({
        id,
        ...config,
        apiKey: this.encryptApiKey(config.apiKey), 
      }));
      localStorage.setItem('llm_configs', JSON.stringify(configsArray));
    } catch (error) {
      console.error('Failed to save LLM configs:', error);
    }
  }

  private loadConfigs(): void {
    try {
      const stored = localStorage.getItem('llm_configs');
      if (stored) {
        const configsArray = JSON.parse(stored);
        for (const item of configsArray) {
          const { id, ...config } = item;
          config.apiKey = this.decryptApiKey(config.apiKey);
          this.configs.set(id, config);
        }
      }
    } catch (error) {
      console.error('Failed to load LLM configs:', error);
    }
  }

  private encryptApiKey(apiKey: string): string {
    
    return btoa(apiKey);
  }

  private decryptApiKey(encrypted: string): string {
    try {
      return atob(encrypted);
    } catch {
      return encrypted; 
    }
  }

  constructor() {
    this.loadConfigs();
  }
}
