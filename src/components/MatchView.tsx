import { useEffect, useState } from 'react';
import { GameConfig, Agent } from '@/types';
import { useGameMatch } from '@/hooks/useGameMatch';
import { HumanAgent, LLMAgent } from '@/agents';
import { GameBoard } from './GameBoard';
import { TranscriptPanel } from './TranscriptPanel';

import { Terminal, HardDrive, RotateCcw, Settings } from 'lucide-react';

interface MatchViewProps {
  gameConfig: GameConfig;
  onBack: () => void;
}

export function MatchView({ gameConfig, onBack }: MatchViewProps) {
  const [matchState, matchActions] = useGameMatch();
  const [initializationKey, setInitializationKey] = useState<string>('');

  const [agents, setAgents] = useState<{ player1: Agent | null; player2: Agent | null }>({
    player1: null,
    player2: null
  });

  useEffect(() => {
    const currentKey = `${gameConfig.engine.name}-${gameConfig.player1.type}-${gameConfig.player2.type}`;
    if (initializationKey !== currentKey) {
      setInitializationKey(currentKey);
      initializeAgents();
    }
  }, [gameConfig, initializationKey]);

  const initializeAgents = async () => {
    if (matchState.isPlaying) {
      return;
    }

    const newAgents: { player1: Agent | null; player2: Agent | null } = {
      player1: null,
      player2: null
    };

    if (gameConfig.player1.type === 'human') {
      newAgents.player1 = new HumanAgent(gameConfig.player1.name);
    } else if (gameConfig.player1.type === 'llm') {
      if (gameConfig.player1.providerId) {
        newAgents.player1 = new LLMAgent(gameConfig.player1.name, gameConfig.engine, gameConfig.player1.providerId);
      } else {
        console.warn('LLM agent configured but no provider ID specified');
        
        newAgents.player1 = new HumanAgent(gameConfig.player1.name + ' (Manual)');
      }
    }

    
    if (gameConfig.player2.type === 'human') {
      newAgents.player2 = new HumanAgent(gameConfig.player2.name);
    } else if (gameConfig.player2.type === 'llm') {
      if (gameConfig.player2.providerId) {
        newAgents.player2 = new LLMAgent(gameConfig.player2.name, gameConfig.engine, gameConfig.player2.providerId);
      } else {
        console.warn('LLM agent configured but no provider ID specified');
        
        newAgents.player2 = new HumanAgent(gameConfig.player2.name + ' (Manual)');
      }
    }

    setAgents(newAgents);

    
    if (newAgents.player1 && newAgents.player2) {
      await matchActions.startMatch(gameConfig, {
        player1: newAgents.player1,
        player2: newAgents.player2
      });
    }
  };



  const handleCellClick = async (row: number, col: number) => {
    if (!matchState.currentState || matchState.isGameOver) return;

    const currentPlayer = matchState.currentState.currentPlayer;
    const agent = agents[currentPlayer];

    if (agent instanceof HumanAgent && agent.isWaitingForMove()) {
      if (gameConfig.engine.name.toLowerCase().includes('connect')) {
        agent.submitMove({ data: { col } }, currentPlayer);
      } else {
        agent.submitMove({ position: { row, col } }, currentPlayer);
      }
    }
  };

  const handleMove = async (move: any) => {
    if (!matchState.currentState || matchState.isGameOver) return;

    const currentPlayer = matchState.currentState.currentPlayer;
    const agent = agents[currentPlayer];

    if (agent instanceof HumanAgent && agent.isWaitingForMove()) {
      agent.submitMove(move, currentPlayer);
    }
  };

  const handleRestart = () => {
    matchActions.resetMatch();
    setInitializationKey('');
  };

  const handleExport = () => {
    const exportData = matchActions.exportMatch();
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `match-${gameConfig.engine.name}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 crt-vignette crt-noise scanlines crt-flicker">
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="btn-secondary flex items-center"
          >
            <Terminal className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">{gameConfig.engine.name}</h2>
            <p className="text-gray-400">
              {gameConfig.player1.name} vs {gameConfig.player2.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRestart}
            className="btn-secondary flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </button>
          {matchState.result && (
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center"
            >
              <HardDrive className="w-4 h-4 mr-2" />
              Export
            </button>
          )}
        </div>
      </div>

      {}
      <div className="card terminal-border scanlines crt-surface crt-vignette">
        <div className="flex items-center justify-between">
          <div>
            {matchState.isPlaying && (
              <p className="text-lg font-medium text-gray-100">
                Current turn: {matchState.currentState?.currentPlayer === 'player1'
                  ? gameConfig.player1.name
                  : gameConfig.player2.name}
              </p>
            )}
            {matchState.isGameOver && matchState.result && (
              <p className="text-lg font-medium text-gray-100">
                Game Over! {matchState.result.finalState.winner
                  ? `Winner: ${matchState.result.finalState.winner === 'player1'
                      ? gameConfig.player1.name
                      : gameConfig.player2.name}`
                  : 'Draw!'}
              </p>
            )}
            {matchState.error && (
              <p className="text-lg font-medium text-red-600">
                Error: {matchState.error}
              </p>
            )}
          </div>
          {matchState.isPlaying && (
            <div className="animate-pulse">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {}
        <div className="xl:col-span-2">
          <GameBoard
            gameEngine={gameConfig.engine}
            gameState={matchState.currentState}
            onCellClick={handleCellClick}
            onMove={handleMove}
            disabled={matchState.isGameOver || !matchState.isPlaying}
            isPlayerTurn={matchState.isPlaying && !matchState.isGameOver}
            currentPlayer={matchState.currentState?.currentPlayer || 'player1'}
          />
        </div>

        {}
        <div className="xl:col-span-1">
          <TranscriptPanel
            transcript={matchState.transcript}
            isPlaying={matchState.isPlaying}
          />
        </div>
      </div>
    </div>
  );
}
