import { useEffect, useRef } from 'react';
import { ScrollText, Activity } from 'lucide-react';

interface TranscriptPanelProps {
  transcript: string[];
  isPlaying: boolean;
}

export function TranscriptPanel({ transcript, isPlaying }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="card h-96 flex flex-col crt-surface crt-vignette scanlines terminal-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center">
          <ScrollText className="w-5 h-5 mr-2" />
          Game Transcript
        </h3>
        {isPlaying && (
          <div className="flex items-center text-sm text-gray-400">
            <Activity className="w-4 h-4 mr-1" />
            Live
          </div>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 text-sm bg-gray-800 p-3 rounded border border-gray-700 font-mono"
      >
        {transcript.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No transcript yet. Start a game to see the move history.
          </div>
        ) : (
          transcript.map((entry, index) => (
            <div key={index} className="text-gray-300">
              {formatTranscriptEntry(entry)}
            </div>
          ))
        )}
        {isPlaying && (
          <div className="flex items-center text-gray-400">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Waiting for next move...
          </div>
        )}
      </div>
    </div>
  );
}

function formatTranscriptEntry(entry: string): React.ReactElement {
  
  const timestampMatch = entry.match(/^\[(.*?)\]\s*/);
  const timestamp = timestampMatch ? timestampMatch[1] : '';
  const cleanEntry = entry.replace(/^\[.*?\]\s*/, '');

  
  if (cleanEntry.includes('Game started:')) {
    return (
      <div className="text-gray-300 font-semibold flex items-center">
        <span className="text-xs text-gray-500 mr-2">{timestamp}</span>
        <span>🎮 {cleanEntry}</span>
      </div>
    );
  }

  if (cleanEntry.includes('Game Over') || cleanEntry.includes('Winner:') || cleanEntry.includes('wins!')) {
    return (
      <div className="text-green-400 font-semibold flex items-center">
        <span className="text-xs text-gray-500 mr-2">{timestamp}</span>
        <span>🏆 {cleanEntry}</span>
      </div>
    );
  }

  
  if (cleanEntry.includes('made move:') || cleanEntry.includes('response:')) {
    const agentMatch = cleanEntry.match(/^(.*?)\s+(made move|response):\s*(.*)$/);
    if (agentMatch) {
      const [, agentName, , moveData] = agentMatch;
      return (
        <div className="text-gray-300 flex items-start">
          <span className="text-xs text-gray-500 mr-2 mt-0.5">{timestamp}</span>
          <div>
            <span className="font-medium">🤖 {agentName}</span>
            <span className="text-gray-300 ml-2">→</span>
            <span className="text-yellow-300 font-mono ml-2 bg-gray-800 px-2 py-0.5 rounded text-sm">
              {moveData}
            </span>
          </div>
        </div>
      );
    }
  }

  
  if (cleanEntry.includes('Player') && cleanEntry.includes('move')) {
    return (
      <div className="text-gray-300 flex items-center">
        <span className="text-xs text-gray-500 mr-2">{timestamp}</span>
        <span>👤 {cleanEntry}</span>
      </div>
    );
  }

  
  if (cleanEntry.includes('turn') || cleanEntry.includes('Current player:')) {
    return (
      <div className="text-gray-300 font-medium flex items-center">
        <span className="text-xs text-gray-500 mr-2">{timestamp}</span>
        <span>⏰ {cleanEntry}</span>
      </div>
    );
  }

  
  if (cleanEntry.includes('Error') || cleanEntry.includes('Invalid') || cleanEntry.includes('failed')) {
    return (
      <div className="text-red-400 flex items-center">
        <span className="text-xs text-gray-500 mr-2">{timestamp}</span>
        <span>❌ {cleanEntry}</span>
      </div>
    );
  }

  
  if (cleanEntry.includes('UCI notation') || cleanEntry.includes('position numbers') || cleanEntry.includes('Move format:')) {
    return (
      <div className="text-amber-400 text-xs flex items-center">
        <span className="text-xs text-gray-500 mr-2">{timestamp}</span>
        <span>💡 {cleanEntry}</span>
      </div>
    );
  }

  
  if (cleanEntry.includes('Board:') || cleanEntry.includes('state:')) {
    return (
      <div className="text-gray-300 font-medium flex items-center">
        <span className="text-xs text-gray-500 mr-2">{timestamp}</span>
        <span>📋 {cleanEntry}</span>
      </div>
    );
  }

  
  if (cleanEntry.includes('|') || cleanEntry.includes('-') ||
      /^\s*[0-9XO\s|+-]+$/.test(cleanEntry) ||
      cleanEntry.includes('♔♕♖♗♘♙♚♛♜♝♞♟') ||
      /^\s*[a-h]\s+[1-8]/.test(cleanEntry)) {
    return (
      <div className="text-gray-200 whitespace-pre font-mono text-xs bg-gray-900 p-2 rounded border-l-2 border-gray-600">
        {cleanEntry}
      </div>
    );
  }

  
  if (cleanEntry.includes('thinking') || cleanEntry.includes('analysis') || cleanEntry.includes('strategy')) {
    return (
      <div className="text-gray-300 text-xs flex items-center">
        <span className="text-xs text-gray-500 mr-2">{timestamp}</span>
        <span>🧠 {cleanEntry}</span>
      </div>
    );
  }

  
  return (
    <div className="text-gray-300 flex items-center">
      {timestamp && <span className="text-xs text-gray-500 mr-2">{timestamp}</span>}
      <span>{cleanEntry}</span>
    </div>
  );
}
