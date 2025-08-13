import { GameEngine, GameState, Move } from '@/types';
import { WasmGameBoard } from './games/WasmGameBoard';
import { WasmGameEngineAdapter } from '@/engines/WasmGameEngineAdapter';

interface GameBoardProps {
  gameEngine: GameEngine;
  gameState: GameState | null;
  onCellClick?: (row: number, col: number) => void;
  onMove?: (move: Move) => void;
  disabled?: boolean;
  isPlayerTurn?: boolean;
  currentPlayer?: string;
}

export function GameBoard({
  gameEngine,
  gameState,
  onCellClick,
  onMove,
  disabled = false,
  isPlayerTurn = true,
  currentPlayer = 'player1'
}: GameBoardProps) {
  if (!gameState) {
    return (
      <div className="game-board crt-surface crt-vignette scanlines terminal-border">
        <div className="text-center text-gray-500 py-8">
          Waiting for game to start...
        </div>
      </div>
    );
  }

  return (
    <WasmGameBoard
      gameEngine={gameEngine as WasmGameEngineAdapter}
      gameState={gameState}
      onMove={onMove!}
      isPlayerTurn={isPlayerTurn}
      currentPlayer={currentPlayer}
      disabled={disabled}
    />
  );
}