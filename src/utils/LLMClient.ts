import { LLMConfig, LLMResponse } from '@/types/agent';

export class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generateResponse(prompt: string): Promise<LLMResponse> {

    
    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.callOpenAI(prompt);
        case 'anthropic':
          return await this.callAnthropic(prompt);
        default:
          throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
      }
    } catch (error) {
      throw new Error(`LLM API call failed: ${error}`);
    }
  }

  private async callOpenAI(prompt: string): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.config.systemPrompt || 'You are a helpful AI assistant playing a game.' },
          { role: 'user', content: prompt }
        ],
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      model: data.model,
      timestamp: Date.now(),
    };
  }

  private async callAnthropic(prompt: string): Promise<LLMResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens || 150,
        temperature: this.config.temperature || 0.7,
        system: this.config.systemPrompt || 'You are a helpful AI assistant playing a game.',
        messages: [ { role: 'user', content: prompt } ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0]?.text || '',
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
      model: data.model,
      timestamp: Date.now(),
    };
  }

  updateConfig(updates: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

export class ResponseParser {
  static parseMove(response: string): unknown {
    try {
      
      const cleaned = response.replace(/```json\s*|\s*```/g, '').trim();
      
      
      const jsonMatch = cleaned.match(/\{[^}]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      
      return JSON.parse(cleaned);
    } catch {
      
      const rowMatch = response.match(/row["\s]*:?\s*(\d+)/i);
      const colMatch = response.match(/col["\s]*:?\s*(\d+)/i);
      
      if (rowMatch && colMatch) {
        return {
          row: parseInt(rowMatch[1]),
          col: parseInt(colMatch[1])
        };
      }
      
      throw new Error(`Could not parse move from response: ${response}`);
    }
  }

  static validateMoveFormat(move: unknown, expectedFormat: 'position' | 'column' | 'custom'): boolean {
    if (!move || typeof move !== 'object') {
      return false;
    }

    const moveObj = move as Record<string, unknown>;

    switch (expectedFormat) {
      case 'position':
        return typeof moveObj.row === 'number' && typeof moveObj.col === 'number';
      case 'column':
        return typeof moveObj.col === 'number';
      case 'custom':
        return true;
      default:
        return false;
    }
  }
}
