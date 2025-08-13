import { useState, useEffect } from 'react';
import { LLMService, LLMConfig } from '@/services/LLMService';
import { X, Plus, Trash2, Settings, Eye, EyeOff, TestTube } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface ConfigPanelProps {
  onClose: () => void;
}

export function ConfigPanel({ onClose }: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'llm' | 'wasm' | 'general'>('llm');
  const [llmConfigs, setLlmConfigs] = useState<Map<string, LLMConfig>>(new Map());
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [customName, setCustomName] = useState<string>('');

  const [newConfig, setNewConfig] = useState<LLMConfig>({
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 1000,
    timeout: 30000
  });

  const llmService = LLMService.getInstance();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = () => {
    setLlmConfigs(llmService.getAllConfigs());
  };

  const handleSaveConfig = () => {
    if (!newConfig.apiKey.trim() && newConfig.provider !== 'ollama') {
      alert('Please enter an API key');
      return;
    }

    if (!customName.trim()) {
      alert('Please enter a custom name for this provider');
      return;
    }

    const trimmedName = customName.trim();
    const existingConfigs = llmService.getAllConfigs();

    if (!editingProvider && existingConfigs.has(trimmedName)) {
      alert('A provider with this name already exists. Please choose a different name.');
      return;
    }

    const providerId = editingProvider || trimmedName;
    llmService.setConfig(providerId, newConfig);
    loadConfigs();
    setEditingProvider(null);
    setShowAddForm(false);
    setCustomName('');
    resetNewConfig();
  };

  const resetNewConfig = () => {
    setNewConfig({
      provider: 'openai',
      model: 'gpt-4o',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000
    });
    setCustomName('');
  };

  const handleEditConfig = (providerId: string, config: LLMConfig) => {
    setEditingProvider(providerId);
    setShowAddForm(false);
    setCustomName(providerId);
    setNewConfig({ ...config });
  };

  const handleDeleteConfig = (providerId: string) => {
    if (confirm('Are you sure you want to delete this LLM configuration?')) {
      llmService.removeConfig(providerId);
      loadConfigs();
    }
  };

  const handleTestConfig = async (providerId: string) => {
    setTestingProvider(providerId);
    setTestResult(null);

    try {
      const response = await llmService.callLLM(
        providerId,
        'Hello! Please respond with "Test successful" to confirm the connection.',
        'You are a helpful AI assistant. Respond briefly and clearly.'
      );
      
      setTestResult({
        success: true,
        message: `✅ Connection successful! Model: ${response.model}`
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ Connection failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const getModelOptions = (provider: string) => {
    switch (provider) {
      case 'openai':
        return [
          'gpt-4o',
          'gpt-4o-2024-11-20',
          'gpt-4o-mini',
          'gpt-4o-mini-2024-07-18',
          'gpt-4-turbo',
          'gpt-3.5-turbo'
        ];
      case 'anthropic':
        return ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];
      case 'deepseek':
        return ['deepseek-chat', 'deepseek-coder'];
      case 'ollama':
        return ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama', 'custom-ollama-model'];
      case 'custom':
        return ['custom-model'];
      default:
        return [];
    }
  };

  const getDefaultBaseUrl = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'deepseek':
        return 'https://api.deepseek.com/v1';
      case 'ollama':
        return 'http://localhost:11434';
      default:
        return '';
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 crt-flicker-strong">
        {}
        <button aria-label="Close settings modal backdrop" onClick={onClose} className="absolute inset-0 w-full h-full cursor-default"></button>
        <div className="relative bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden terminal-border crt-vignette scanlines">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex">
          {}
          <div className="w-64 bg-gray-800 border-r border-gray-700">
            <nav className="p-4 space-y-2">
              <button
                onClick={() => setActiveTab('llm')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'llm'
                    ? 'bg-accent-600 text-gray-100'
                    : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700'
                }`}
              >
                LLM Providers
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'general'
                    ? 'bg-accent-600 text-gray-100'
                    : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700'
                }`}
              >
                General
              </button>
            </nav>
          </div>

          {}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'llm' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-100">LLM Providers</h3>
                  <button
                    onClick={() => {
                      setEditingProvider(null);
                      setShowAddForm(true);
                      resetNewConfig();
                    }}
                    className="btn-primary flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Provider
                  </button>
                </div>

                {}
                <div className="space-y-4">
                  {Array.from(llmConfigs.entries()).map(([providerId, config]) => (
                    <div key={providerId} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-medium text-gray-100">
                            {providerId}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {config.provider.toUpperCase()} • {config.model}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTestConfig(providerId)}
                            disabled={testingProvider === providerId}
                            className="p-2 text-gray-300 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50"
                            title="Test Connection"
                          >
                            <TestTube className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditConfig(providerId, config)}
                            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteConfig(providerId)}
                            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Temperature:</span>
                          <span className="text-gray-200 ml-2">{config.temperature}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Max Tokens:</span>
                          <span className="text-gray-200 ml-2">{config.maxTokens}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Timeout:</span>
                          <span className="text-gray-200 ml-2">{config.timeout}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-400">API Key:</span>
                          <span className="text-gray-200 ml-2">
                            {showApiKey[providerId] ? config.apiKey : '••••••••'}
                          </span>
                          <button
                            onClick={() => setShowApiKey(prev => ({ ...prev, [providerId]: !prev[providerId] }))}
                            className="ml-2 text-gray-400 hover:text-gray-200"
                          >
                            {showApiKey[providerId] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {testingProvider === providerId && (
                        <div className="mt-3 text-sm text-gray-400">
                          Testing connection...
                        </div>
                      )}

                      {testResult && testingProvider !== providerId && (
                        <div className={`mt-3 text-sm ${testResult.success ? 'text-gray-200' : 'text-gray-300'}`}>
                          {testResult.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {}
                {(editingProvider !== null || showAddForm || llmConfigs.size === 0) && (
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h4 className="text-lg font-medium text-gray-100 mb-4">
                      {editingProvider ? 'Edit Provider' : 'Add New Provider'}
                    </h4>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Custom Name *
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g., 'DeepSeek Personal', 'OpenAI GPT-4', 'Work Account'"
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const suggestedName = `${newConfig.provider.charAt(0).toUpperCase() + newConfig.provider.slice(1)} ${newConfig.model}`;
                            setCustomName(suggestedName);
                          }}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 text-sm rounded-md transition-colors"
                          title="Auto-generate name from provider and model"
                        >
                          Auto
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Give this provider configuration a memorable name to easily identify it later.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Provider
                        </label>
                        <select
                          value={newConfig.provider}
                          onChange={(e) => {
                            const provider = e.target.value as LLMConfig['provider'];
                            const model = getModelOptions(provider)[0] || '';
                            setNewConfig(prev => ({
                              ...prev,
                              provider,
                              model,
                              baseUrl: getDefaultBaseUrl(provider)
                            }));

                            if (!editingProvider && !customName.trim()) {
                              const suggestedName = `${provider.charAt(0).toUpperCase() + provider.slice(1)} ${model}`;
                              setCustomName(suggestedName);
                            }
                          }}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="deepseek">DeepSeek</option>
                          <option value="ollama">Ollama (Local)</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Model
                        </label>
                        <select
                          value={newConfig.model}
                          onChange={(e) => {
                            const model = e.target.value;
                            setNewConfig(prev => ({ ...prev, model }));

                            if (!editingProvider && !customName.trim()) {
                              const suggestedName = `${newConfig.provider.charAt(0).toUpperCase() + newConfig.provider.slice(1)} ${model}`;
                              setCustomName(suggestedName);
                            }
                          }}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        >
                          {getModelOptions(newConfig.provider).map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          API Key {newConfig.provider === 'ollama' && <span className="text-gray-400 text-xs">(Optional for local Ollama)</span>}
                        </label>
                        <input
                          type="password"
                          value={newConfig.apiKey}
                          onChange={(e) => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          placeholder={newConfig.provider === 'ollama' ? 'Optional - leave empty for local Ollama' : 'Enter your API key'}
                        />
                      </div>

                      {(newConfig.provider === 'custom' || newConfig.provider === 'ollama') && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Base URL
                          </label>
                          <input
                            type="url"
                            value={newConfig.baseUrl || ''}
                            onChange={(e) => setNewConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                            placeholder={newConfig.provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com/v1'}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Temperature ({newConfig.temperature})
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={newConfig.temperature}
                          onChange={(e) => setNewConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          value={newConfig.maxTokens}
                          onChange={(e) => setNewConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          min="1"
                          max="4000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Timeout (ms)
                        </label>
                        <input
                          type="number"
                          value={newConfig.timeout}
                          onChange={(e) => setNewConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          min="1000"
                          max="120000"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setEditingProvider(null);
                          setShowAddForm(false);
                          resetNewConfig();
                        }}
                        className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveConfig}
                        className="btn-primary"
                      >
                        {editingProvider ? 'Update' : 'Add'} Provider
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wasm' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-100">WASM Game Settings</h3>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <p className="text-gray-300">
                    WASM game settings and validation options will be available here.
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Configure upload limits, validation rules, and security settings for WASM games.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-100">General Settings</h3>
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-200 mb-2">Theme</h4>
                      <p className="text-gray-400 text-sm">
                        Currently using dark theme (default)
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-200 mb-2">Data Management</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        All settings are stored locally in your browser
                      </p>
                      <button
                        onClick={() => {
                          if (confirm('This will clear all LLM configurations and settings. Are you sure?')) {
                            llmConfigs.forEach((_, id) => llmService.removeConfig(id));
                            loadConfigs();
                          }
                        }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-md transition-colors"
                      >
                        Clear All Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        </div>
      </ModalPortal>
    );
}
