import { useState, useEffect } from 'react';
import { GameConfig, AgentConfig } from '@/types';

import { wasmGameLoader } from '../services/WasmGameLoader';
import { WasmGameEngineAdapter } from '../engines/WasmGameEngineAdapter';
import { LLMService } from '@/services/LLMService';
import { ModernWasmUpload } from './ModernWasmUpload';
import { ModernGameCard } from './ModernGameCard';
import { Zap, Monitor, HardDrive, Database, Bot, User } from 'lucide-react';

interface GameSelectionProps {
  onGameStart: (config: GameConfig) => void;
}



const agentTypes = [
  {
    type: 'human' as const,
    name: 'Human Player',
    icon: User,
    description: 'You play manually'
  },
  {
    type: 'llm' as const,
    name: 'Smart AI Agent',
    icon: Bot,
    description: 'Advanced rule-based AI opponent'
  },


];

export function GameSelection({ onGameStart }: GameSelectionProps) {
  const [selectedWasmGame, setSelectedWasmGame] = useState<WasmGameEngineAdapter | null>(null);
  const [wasmGames, setWasmGames] = useState<WasmGameEngineAdapter[]>([]);
  const [player1Config, setPlayer1Config] = useState<AgentConfig>({
    type: 'human',
    name: 'Player 1'
  });
  const [player2Config, setPlayer2Config] = useState<AgentConfig>({
    type: 'llm',
    name: 'AI Opponent'
  });
  const [showModernUpload, setShowModernUpload] = useState(false);

  const llmService = LLMService.getInstance();

  useEffect(() => {
    (async () => {
      await wasmGameLoader.whenReady?.();
      loadWasmGames();
      loadLLMProviders();
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadLLMProviders();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    const interval = setInterval(() => {
      const currentGameCount = wasmGameLoader.getGameCount();
      if (currentGameCount !== wasmGames.length) {
        console.log('🔄 GameSelection: Game count changed, refreshing...', currentGameCount, 'vs', wasmGames.length);
        loadWasmGames();
      }
    }, 2000); 

    return () => clearInterval(interval);
  }, [wasmGames.length]);

  const loadWasmGames = () => {
    console.log('🔄 GameSelection: Loading WASM games...');
    const loadedGames = wasmGameLoader.getAllGames();
    console.log('📊 GameSelection: Found', loadedGames.length, 'loaded games');

    
    const adapters: WasmGameEngineAdapter[] = [];

    loadedGames.forEach(loadedGame => {
      console.log('🎮 GameSelection: Processing game:', loadedGame.metadata.name);
      try {
        
        const adapter = new WasmGameEngineAdapter(loadedGame);
        adapters.push(adapter);
        console.log('✅ GameSelection: Created adapter for:', loadedGame.metadata.name);
      } catch (error) {
        console.error('❌ GameSelection: Failed to create adapter for:', loadedGame.metadata.name, error);
      }
    });

    console.log('🎯 GameSelection: Setting', adapters.length, 'game adapters');
    setWasmGames(adapters);
  };

  const loadLLMProviders = () => {
    const configs = llmService.getAllConfigs();

    if (configs.size > 0) {
      const firstProvider = configs.keys().next().value;


      if (player1Config.type === 'llm' && !player1Config.providerId) {
        setPlayer1Config(prev => ({ ...prev, providerId: firstProvider }));
      }


      if (player2Config.type === 'llm' && !player2Config.providerId) {
        setPlayer2Config(prev => ({ ...prev, providerId: firstProvider }));
      }
    }
  };

  const handleStartGame = () => {
    if (!selectedWasmGame) {
      alert('Please select a WASM game engine first');
      return;
    }

    const engine = selectedWasmGame;

    const config: GameConfig = {
      engine,
      player1: player1Config,
      player2: player2Config
    };
    onGameStart(config);
  };





  const updatePlayerConfig = (
    player: 'player1' | 'player2',
    updates: Partial<AgentConfig>
  ) => {

    if (updates.type === 'llm') {
      const configs = llmService.getAllConfigs();
      if (configs.size > 0 && !updates.providerId) {
        const firstProvider = configs.keys().next().value;
        updates.providerId = firstProvider;
      }
    }

    if (player === 'player1') {
      setPlayer1Config(prev => ({ ...prev, ...updates }));
    } else {
      setPlayer2Config(prev => ({ ...prev, ...updates }));
    }
  };

  return (
    <div className="space-y-8 scanlines">
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowModernUpload(true)}
            className="flex items-center px-4 py-2 btn-primary rounded-lg text-sm terminal-border"
            title="Upload WASM Game"
          >
            <HardDrive className="w-4 h-4 mr-2" />
            Upload WASM
          </button>
        </div>
      </div>

      {}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-100 mb-6">
          Available Games ({wasmGames.length})
          {selectedWasmGame && (
            <span className="ml-3 text-sm text-accent-400">
              Selected: {selectedWasmGame.getMetadata().name}
            </span>
          )}
        </h3>

        {wasmGames.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-300 mb-2">
              No WASM games uploaded
            </h4>
            <p className="text-gray-500 mb-6">
              Upload your first WebAssembly game engine to get started
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowModernUpload(true)}
                className="px-6 py-3 btn-primary rounded-lg transition-all duration-300 flex items-center text-sm font-medium terminal-border"
              >
                <HardDrive className="w-4 h-4 mr-2" />
                Upload WASM Game
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wasmGames.map((game) => {
              const metadata = game.getMetadata();
              const isSelected = selectedWasmGame?.getMetadata().name === metadata.name;

              return (
                <ModernGameCard
                  key={metadata.name}
                  metadata={metadata}
                  isSelected={isSelected}
                  onClick={() => {
                    console.log('🎯 GameSelection: WASM game selected:', metadata.name);
                    setSelectedWasmGame(game);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Player 1 (X)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Player Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {agentTypes.map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <button
                      key={agent.type}
                      onClick={() => updatePlayerConfig('player1', {
                        type: agent.type,
                        name: agent.name
                      })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        player1Config.type === agent.type
                          ? 'border-primary-500 bg-primary-900/30'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-200">{agent.name}</div>
                          <div className="text-sm text-gray-400">{agent.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={player1Config.name}
                onChange={(e) => updatePlayerConfig('player1', { name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {}
            {player1Config.type === 'llm' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  LLM Provider
                </label>
                <select
                  value={player1Config.providerId || ''}
                  onChange={(e) => updatePlayerConfig('player1', { providerId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select LLM Provider</option>
                  {Array.from(llmService.getAllConfigs().entries()).map(([id, config]) => (
                    <option key={id} value={id}>
                      {id} ({config.provider.toUpperCase()} - {config.model})
                    </option>
                  ))}
                </select>
                {Array.from(llmService.getAllConfigs()).length === 0 && (
                  <p className="text-yellow-400 text-sm mt-1">
                    No LLM providers configured. Go to Settings to add one.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Player 2 (O)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Player Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {agentTypes.map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <button
                      key={agent.type}
                      onClick={() => updatePlayerConfig('player2', {
                        type: agent.type,
                        name: agent.name
                      })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        player2Config.type === agent.type
                          ? 'border-primary-500 bg-primary-900/30'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-200">{agent.name}</div>
                          <div className="text-sm text-gray-400">{agent.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={player2Config.name}
                onChange={(e) => updatePlayerConfig('player2', { name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {}
            {player2Config.type === 'llm' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  LLM Provider
                </label>
                <select
                  value={player2Config.providerId || ''}
                  onChange={(e) => updatePlayerConfig('player2', { providerId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select LLM Provider</option>
                  {Array.from(llmService.getAllConfigs().entries()).map(([id, config]) => (
                    <option key={id} value={id}>
                      {id} ({config.provider.toUpperCase()} - {config.model})
                    </option>
                  ))}
                </select>
                {Array.from(llmService.getAllConfigs()).length === 0 && (
                  <p className="text-yellow-400 text-sm mt-1">
                    No LLM providers configured. Go to Settings to add one.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="text-center">
        <button
          onClick={handleStartGame}
          disabled={!selectedWasmGame}
          className="btn-primary text-lg px-8 py-4 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-5 h-5 mr-2" />
          Start Battle
          {selectedWasmGame && (
            <span className="ml-2 text-sm">
              ({selectedWasmGame.getMetadata().name})
            </span>
          )}
        </button>

        {!selectedWasmGame && wasmGames.length > 0 && (
          <p className="text-gray-400 text-sm mt-2">
            Please select a WASM game to start
          </p>
        )}
      </div>

      {}
      {showModernUpload && (
        <ModernWasmUpload
          onClose={() => setShowModernUpload(false)}
          onGameUploaded={(gameId) => {
            console.log('🎯 GameSelection: Game uploaded via modern upload:', gameId);
            setShowModernUpload(false);

            
            console.log('🔄 GameSelection: Refreshing games after modern upload...');
            loadWasmGames();

            
            setTimeout(() => {
              const loadedGame = wasmGameLoader.getGame(gameId);
              if (loadedGame) {
                console.log('🎮 GameSelection: Found loaded game, creating adapter...');
                try {
                  const adapter = new WasmGameEngineAdapter(loadedGame);
                  setSelectedWasmGame(adapter);
                  console.log('✅ GameSelection: Auto-selected uploaded game:', loadedGame.metadata.name);
                } catch (error) {
                  console.error('❌ GameSelection: Failed to create adapter:', error);
                }
              }
            }, 100);
          }}
        />
      )}

    </div>
  );
}
