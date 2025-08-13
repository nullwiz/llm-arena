import { useState, useCallback, useRef } from 'react';
import { GameState, MatchResult, GameConfig, Agent, PlayerId } from '@/types';
import { MatchController, MatchControllerEvents } from '@/utils/MatchController';

let globalMatchController: MatchController | null = null;

export interface GameMatchState {
  currentState: GameState | null;
  isPlaying: boolean;
  isGameOver: boolean;
  result: MatchResult | null;
  transcript: string[];
  error: string | null;
}

export interface GameMatchActions {
  startMatch: (config: GameConfig, agents: { player1: Agent; player2: Agent }) => Promise<void>;
  stopMatch: () => void;
  makeMove: (move: any, playerId: PlayerId) => Promise<boolean>;
  resetMatch: () => void;
  exportMatch: () => string | null;
}

export function useGameMatch(): [GameMatchState, GameMatchActions] {
  const [state, setState] = useState<GameMatchState>({
    currentState: null,
    isPlaying: false,
    isGameOver: false,
    result: null,
    transcript: [],
    error: null
  });

  const matchControllerRef = useRef<MatchController | null>(null);

  const updateState = useCallback((updates: Partial<GameMatchState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const startMatch = useCallback(async (
    config: GameConfig,
    agents: { player1: Agent; player2: Agent }
  ) => {
    if (globalMatchController) {
      console.warn('useGameMatch: Match already running, ignoring duplicate start request');
      return;
    }

    try {
      updateState({
        isPlaying: true,
        isGameOver: false,
        result: null,
        error: null,
        transcript: []
      });

      const events: MatchControllerEvents = {
        onStateChange: (gameState) => {
          updateState({ currentState: gameState });
        },
        onMoveAttempt: (move, valid) => {
          if (!valid) {
            console.warn('Invalid move attempted:', move);
          }
        },
        onGameEnd: (result) => {
          updateState({
            isGameOver: true,
            isPlaying: false,
            result,
            transcript: matchControllerRef.current?.getTranscript() || []
          });
          globalMatchController = null;
        },
        onError: (error) => {
          updateState({
            error: error.message,
            isPlaying: false
          });
          globalMatchController = null;
        }
      };

      const controller = new MatchController(config, events);
      globalMatchController = matchControllerRef.current;
      controller.setAgent('player1', agents.player1);
      controller.setAgent('player2', agents.player2);
      
      matchControllerRef.current = controller;
      
      await controller.startMatch();
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isPlaying: false
      });
      globalMatchController = null;
    }
  }, [updateState]);

  const stopMatch = useCallback(() => {
    matchControllerRef.current = null;
    globalMatchController = null;
    updateState({
      isPlaying: false,
      error: null
    });
  }, [updateState]);

  const makeMove = useCallback(async (move: any, playerId: PlayerId): Promise<boolean> => {
    if (!matchControllerRef.current) {
      return false;
    }

    try {
      const fullMove = {
        playerId,
        position: move.position,
        data: move.data,
        timestamp: Date.now()
      };

      return await matchControllerRef.current.makeMove(fullMove);
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to make move'
      });
      return false;
    }
  }, [updateState]);

  const resetMatch = useCallback(() => {
    matchControllerRef.current = null;
    globalMatchController = null;
    setState({
      currentState: null,
      isPlaying: false,
      isGameOver: false,
      result: null,
      transcript: [],
      error: null
    });
  }, []);

  const exportMatch = useCallback((): string | null => {
    if (!state.result) {
      return null;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      gameConfig: state.result.gameConfig,
      finalState: state.result.finalState,
      duration: state.result.duration,
      moveCount: state.result.moveCount,
      transcript: state.transcript,
      result: {
        winner: state.result.finalState.winner,
        result: state.result.finalState.result
      }
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.result, state.transcript]);

  const actions: GameMatchActions = {
    startMatch,
    stopMatch,
    makeMove,
    resetMatch,
    exportMatch
  };

  return [state, actions];
}
