import { useState, useEffect } from 'react';
import { GameState, Move } from '@/types';
import { WasmGameEngineAdapter } from '../../engines/WasmGameEngineAdapter';

interface WasmGameBoardProps {
  gameEngine: WasmGameEngineAdapter;
  gameState: GameState;
  onMove: (move: Move) => void;
  isPlayerTurn: boolean;
  currentPlayer: string;
  disabled?: boolean;
}

export function WasmGameBoard({
  gameEngine,
  gameState,
  onMove,
  isPlayerTurn,
  currentPlayer,
  disabled = false
}: WasmGameBoardProps) {
  const [renderedBoard, setRenderedBoard] = useState<string>('');
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string>('');

  
  useEffect(() => {
    try {
      console.log('🎮 WasmGameBoard: Rendering game state...');

      
      const rendered = gameEngine.getBoardDisplay();
      setRenderedBoard(rendered);
      console.log('✅ WasmGameBoard: Board rendered');

      
      const moves = gameEngine.getValidMoves();
      const moveStrings = moves.map(move => move.data as string);
      setValidMoves(moveStrings);
      console.log('📋 WasmGameBoard: Valid moves:', moveStrings);

      
      const gameOver = gameEngine.isGameOver();
      setIsGameOver(gameOver);

      if (gameOver) {
        
        const winner = gameState.winner || (gameState.currentPlayer === 'player1' ? 'player2' : 'player1');
        setWinner(winner);
        console.log('🏁 WasmGameBoard: Game over, winner:', winner);
      }

    } catch (error) {
      console.error('❌ WasmGameBoard: Error rendering board:', error);
      setRenderedBoard('Error rendering game board');
    }
  }, [gameEngine, gameState]);

  const handleMoveClick = (moveStr: string) => {
    if (disabled || !isPlayerTurn || isGameOver) {
      return;
    }

    console.log('🎯 WasmGameBoard: Player attempting move:', moveStr);
    
    try {
      
      const move: Move = {
        playerId: currentPlayer as 'player1' | 'player2',
        data: moveStr, 
        timestamp: Date.now()
      };

      onMove(move);
      console.log('✅ WasmGameBoard: Move submitted');
    } catch (error) {
      console.error('❌ WasmGameBoard: Error making move:', error);
    }
  };

  return (
    <div className="wasm-game-board">
      {}
      <div className="mb-4 text-center">
        <div className="text-lg font-semibold text-gray-100 mb-2">
          {gameEngine.name}
        </div>
        {isGameOver ? (
          <div className="text-xl font-bold text-accent-400">
            {winner === 'draw' ? 'Game Draw!' : `${winner} Wins!`}
          </div>
        ) : (
          <div className="text-gray-300">
            Current Player: <span className="text-accent-400 font-semibold">{currentPlayer}</span>
            {!isPlayerTurn && <span className="text-gray-500 ml-2">(Waiting for opponent...)</span>}
          </div>
        )}
      </div>

      {}
      <div className="game-board-container bg-gray-800 rounded-lg p-6 mb-4">
        <pre className="text-gray-100 font-mono text-sm whitespace-pre-wrap leading-relaxed">
          {renderedBoard}
        </pre>
      </div>

      {}
      {isPlayerTurn && !isGameOver && validMoves.length > 0 && (
        <div className="moves-container">
          <div className="text-sm text-gray-400 mb-3">Available Moves:</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2">
            {validMoves.map((move, index) => (
              <button
                key={index}
                onClick={() => handleMoveClick(move)}
                disabled={disabled}
                className="move-button bg-gray-700 hover:bg-accent-600 text-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {move}
              </button>
            ))}
          </div>
        </div>
      )}

      {}
      {isGameOver && (
        <div className="text-center mt-4 p-4 bg-gray-800 rounded-lg">
          <div className="text-lg font-semibold text-gray-100 mb-2">Game Complete</div>
          {winner === 'draw' ? (
            <div className="text-yellow-400">It's a draw!</div>
          ) : (
            <div className="text-green-400">Winner: {winner}</div>
          )}
        </div>
      )}

      {}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-500">
          <div>Game State: {JSON.stringify(gameState, null, 2)}</div>
          <div>Valid Moves: {validMoves.join(', ')}</div>
          <div>Is Player Turn: {isPlayerTurn ? 'Yes' : 'No'}</div>
          <div>Current Player: {currentPlayer}</div>
        </div>
      )}
    </div>
  );
}
