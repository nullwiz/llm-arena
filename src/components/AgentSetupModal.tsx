import { useState } from 'react';
import { LLMConfig } from '@/types';
import { ConfigManager } from '@/utils';
import { X, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface AgentSetupModalProps {
  onSetup: (config: LLMConfig) => void;
  onCancel: () => void;
}

export function AgentSetupModal({ onSetup, onCancel }: AgentSetupModalProps) {
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 150
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = ConfigManager.validateLLMConfig(config);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSetup(config);
  };

  const updateConfig = (updates: Partial<LLMConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setErrors([]); 
  };

  const modelOptions: Record<string, { value: string; label: string }[]> = {
    openai: [
      { value: 'gpt-4o', label: 'GPT-4o (Latest)' },
      { value: 'gpt-4o-2024-11-20', label: 'GPT-4o (2024-11-20)' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
      { value: 'gpt-4o-mini-2024-07-18', label: 'GPT-4o Mini (2024-07-18)' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
    ],
    anthropic: [
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Recommended)' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Best)' }
    ],
    deepseek: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat (Recommended)' },
      { value: 'deepseek-coder', label: 'DeepSeek Coder' }
    ],
    ollama: [
      { value: 'llama3.2', label: 'Llama 3.2 (Latest)' },
      { value: 'llama3.1', label: 'Llama 3.1' },
      { value: 'llama3', label: 'Llama 3' },
      { value: 'mistral', label: 'Mistral' },
      { value: 'codellama', label: 'Code Llama' }
    ],
    custom: [
      { value: 'custom-model', label: 'Custom Model' }
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 crt-noise crt-flicker-strong">
      <div className="bg-gray-900 text-gray-100 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto terminal-border crt-surface crt-vignette scanlines">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Setup AI Agent</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Privacy Notice</p>
                <p>
                  Your API keys are stored locally in your browser and never sent to our servers. 
                  Only you have access to them.
                </p>
              </div>
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateConfig({ provider: 'openai', model: 'gpt-4o' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  config.provider === 'openai'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">OpenAI</div>
                <div className="text-sm text-gray-600">GPT models</div>
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ provider: 'anthropic', model: 'claude-3-sonnet-20240229' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  config.provider === 'anthropic'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Anthropic</div>
                <div className="text-sm text-gray-600">Claude models</div>
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ provider: 'deepseek', model: 'deepseek-chat' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  config.provider === 'deepseek'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">DeepSeek</div>
                <div className="text-sm text-gray-600">DeepSeek models</div>
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ provider: 'ollama', model: 'llama3.2', apiKey: '' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  config.provider === 'ollama'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Ollama</div>
                <div className="text-sm text-gray-600">Local models</div>
              </button>
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={config.model}
              onChange={(e) => updateConfig({ model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {modelOptions[config.provider].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key {config.provider === 'ollama' && <span className="text-gray-500 text-xs">(Optional for local Ollama)</span>}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                placeholder={
                  config.provider === 'ollama'
                    ? 'Optional - leave empty for local Ollama'
                    : `Enter your ${config.provider === 'openai' ? 'OpenAI' : config.provider === 'anthropic' ? 'Anthropic' : config.provider.toUpperCase()} API key`
                }
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config.provider !== 'ollama' && (
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from{' '}
                <a
                  href={config.provider === 'openai'
                    ? 'https://platform.openai.com/api-keys'
                    : config.provider === 'anthropic'
                    ? 'https://console.anthropic.com/'
                    : config.provider === 'deepseek'
                    ? 'https://platform.deepseek.com/'
                    : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  {config.provider === 'openai' ? 'OpenAI Platform' :
                   config.provider === 'anthropic' ? 'Anthropic Console' :
                   config.provider === 'deepseek' ? 'DeepSeek Platform' : 'Provider Console'}
                </a>
              </p>
            )}
            {config.provider === 'ollama' && (
              <p className="text-xs text-gray-500 mt-1">
                Make sure Ollama is running locally. Install from{' '}
                <a
                  href="https://ollama.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  ollama.ai
                </a>
              </p>
            )}
          </div>

          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="4000"
                value={config.maxTokens}
                onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Please fix the following errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Setup Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
