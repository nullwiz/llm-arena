import { LLMConfig } from '@/types';

export interface StoredConfig {
  llmConfigs: Record<string, LLMConfig>;
  preferences: {
    defaultProvider: 'openai' | 'anthropic' | 'deepseek' | 'ollama';
    theme: 'light' | 'dark';
    autoSave: boolean;
  };
  gameSettings: Record<string, any>;
}

export class ConfigManager {
  private static readonly STORAGE_KEY = 'llm-arena-config';
  private static readonly API_KEY_WARNING_SHOWN = 'api-key-warning-shown';

  static getConfig(): StoredConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }

    return this.getDefaultConfig();
  }

  static saveConfig(config: StoredConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
      throw new Error('Failed to save configuration. Please check your browser storage settings.');
    }
  }

  static updateLLMConfig(name: string, config: LLMConfig): void {
    const currentConfig = this.getConfig();
    currentConfig.llmConfigs[name] = config;
    this.saveConfig(currentConfig);
  }

  static getLLMConfig(name: string): LLMConfig | null {
    const config = this.getConfig();
    return config.llmConfigs[name] || null;
  }

  static deleteLLMConfig(name: string): void {
    const config = this.getConfig();
    delete config.llmConfigs[name];
    this.saveConfig(config);
  }

  static listLLMConfigs(): string[] {
    const config = this.getConfig();
    return Object.keys(config.llmConfigs);
  }

  static updatePreferences(updates: Partial<StoredConfig['preferences']>): void {
    const config = this.getConfig();
    config.preferences = { ...config.preferences, ...updates };
    this.saveConfig(config);
  }

  static getPreferences(): StoredConfig['preferences'] {
    return this.getConfig().preferences;
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.API_KEY_WARNING_SHOWN);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  static showAPIKeyWarning(): boolean {
    const shown = localStorage.getItem(this.API_KEY_WARNING_SHOWN);
    if (!shown) {
      localStorage.setItem(this.API_KEY_WARNING_SHOWN, 'true');
      return true;
    }
    return false;
  }

  static validateLLMConfig(config: LLMConfig): string[] {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('Provider is required');
    } else if (!['openai', 'anthropic', 'deepseek', 'ollama', 'custom'].includes(config.provider)) {
      errors.push('Provider must be one of: openai, anthropic, deepseek, ollama, custom');
    }

    if (!config.model) {
      errors.push('Model is required');
    }

    if (!config.apiKey && config.provider !== 'ollama') {
      errors.push('API key is required');
    } else if (config.apiKey && config.apiKey.length < 10) {
      errors.push('API key appears to be too short');
    }

    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        errors.push('Temperature must be between 0 and 2');
      }
    }

    if (config.maxTokens !== undefined) {
      if (config.maxTokens < 1 || config.maxTokens > 4000) {
        errors.push('Max tokens must be between 1 and 4000');
      }
    }

    return errors;
  }

  private static getDefaultConfig(): StoredConfig {
    return {
      llmConfigs: {},
      preferences: {
        defaultProvider: 'openai',
        theme: 'light',
        autoSave: true
      },
      gameSettings: {}
    };
  }

  static exportConfig(): string {
    const config = this.getConfig();
    
    const exportConfig = {
      ...config,
      llmConfigs: Object.fromEntries(
        Object.entries(config.llmConfigs).map(([name, llmConfig]) => [
          name,
          { ...llmConfig, apiKey: '[REDACTED]' }
        ])
      )
    };
    return JSON.stringify(exportConfig, null, 2);
  }

  static importConfig(configJson: string, includeApiKeys: boolean = false): void {
    try {
      const importedConfig = JSON.parse(configJson);
      const currentConfig = this.getConfig();
      
      
      if (importedConfig.preferences) {
        currentConfig.preferences = { ...currentConfig.preferences, ...importedConfig.preferences };
      }
      
      if (importedConfig.gameSettings) {
        currentConfig.gameSettings = { ...currentConfig.gameSettings, ...importedConfig.gameSettings };
      }
      
      if (importedConfig.llmConfigs && includeApiKeys) {
        currentConfig.llmConfigs = { ...currentConfig.llmConfigs, ...importedConfig.llmConfigs };
      }
      
      this.saveConfig(currentConfig);
    } catch (error) {
      throw new Error('Invalid configuration format');
    }
  }
}
