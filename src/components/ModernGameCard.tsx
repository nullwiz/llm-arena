import { } from 'react';
import { CheckCircle, Zap, Monitor, Cpu, Star } from 'lucide-react';
import { GameMetadata } from '@/interfaces/WasmGameEngine';

interface ModernGameCardProps {
  metadata: GameMetadata;
  isSelected: boolean;
  onClick: () => void;
}

export function ModernGameCard({ metadata, isSelected, onClick }: ModernGameCardProps) {
  const getGameIcon = (metadata: GameMetadata) => {
    const gameType = metadata.gameType?.toLowerCase() || metadata.name.toLowerCase();
    
    if (gameType.includes('chess')) return '♟️';
    if (gameType.includes('tic')) return '⭕';
    if (gameType.includes('puzzle')) return '🧩';
    if (gameType.includes('strategy')) return '🎯';
    if (gameType.includes('card')) return '🃏';
    if (gameType.includes('word')) return '📝';
    if (gameType.includes('number')) return '🔢';
    return '🎮';
  };

  const getGradientClasses = () => {
    return 'from-gray-700/20 to-gray-900/20 border-gray-600/40 shadow-black/10';
  };

  const getHoverGlow = () => {
    return 'group-hover:shadow-gray-500/20';
  };

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${
        isSelected ? 'scale-105 -translate-y-2' : ''
      }`}
    >
      {}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute top-4 right-4 w-1 h-1 bg-gray-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute bottom-6 left-6 w-0.5 h-0.5 bg-gray-500 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-1/2 left-4 w-0.5 h-0.5 bg-gray-400 rounded-full animate-bounce opacity-40"></div>
      </div>

      {}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${getGradientClasses()} opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl ${getHoverGlow()}`} />
      
      {}
      <div className={`relative bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-500 ${
        isSelected 
          ? `${getGradientClasses()} shadow-2xl`
          : 'border-gray-700/50 hover:border-gray-600/50'
      } ${getHoverGlow()}`}>
        
        {}
        {isSelected && (
          <div className="absolute top-4 right-4 animate-pulse">
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center shadow-lg border border-gray-600">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {}
        <div className="text-center mb-6">
          <div className="text-7xl mb-2 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            {getGameIcon(metadata)}
          </div>
          {}
          <div className={`w-16 h-2 mx-auto rounded-full bg-gradient-to-r ${getGradientClasses()} opacity-0 group-hover:opacity-60 transition-opacity duration-300 blur-sm`} />
        </div>

        {}
        <div className="text-center mb-6">
          <h4 className="text-xl font-bold text-gray-100 mb-2 header-glow phosphor-cyan">
            {metadata.name}
          </h4>
          {metadata.description && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
              {metadata.description}
            </p>
          )}
          {metadata.author && (
            <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
              by {metadata.author}
            </p>
          )}
          {metadata.version && (
            <p className="text-xs text-gray-600 mt-1">v{metadata.version}</p>
          )}
        </div>

        {}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {metadata.aiPrompts && (
            <span className="bg-gray-800/60 border border-gray-600/50 text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-all duration-300 hover:scale-105">
              <Zap className="w-3 h-3 mr-1 animate-pulse" />
              AI Prompts
            </span>
          )}
          {metadata.gameType && (
            <span className="bg-gray-700/50 border border-gray-600/50 text-gray-300 px-3 py-1.5 rounded-full text-xs hover:bg-gray-600/50 hover:border-gray-500/50 transition-all duration-300">
              {metadata.gameType}
            </span>
          )}
          {metadata.difficulty && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 ${
              metadata.difficulty === 'easy' ? 'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30' :
              metadata.difficulty === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30' :
              metadata.difficulty === 'hard' ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:bg-orange-500/30' :
              'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30'
            }`}>
              <Star className="w-3 h-3 inline mr-1" />
              {metadata.difficulty}
            </span>
          )}
        </div>

        {}
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
          {(metadata.minPlayers || metadata.maxPlayers) && (
            <div className="flex items-center">
              <Monitor className="w-3 h-3 mr-1" />
              {metadata.minPlayers && metadata.maxPlayers 
                ? `${metadata.minPlayers}-${metadata.maxPlayers} players`
                : metadata.minPlayers 
                  ? `${metadata.minPlayers}+ players`
                  : `Up to ${metadata.maxPlayers} players`
              }
            </div>
          )}
          {metadata.estimatedPlayTime && (
            <div className="flex items-center">
              <Cpu className="w-3 h-3 mr-1" />
              {metadata.estimatedPlayTime}
            </div>
          )}
        </div>

        {}
        {metadata.tags && metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {metadata.tags.slice(0, 3).map((tag: string, index: number) => (
              <span key={index} className="bg-gray-800/50 text-gray-400 px-2 py-0.5 rounded text-xs">
                #{tag}
              </span>
            ))}
            {metadata.tags.length > 3 && (
              <span className="text-gray-500 text-xs">+{metadata.tags.length - 3} more</span>
            )}
          </div>
        )}

        {}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
        
        {}
        <div className={`absolute inset-0 rounded-2xl border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
          isSelected ? 'animate-pulse' : ''
        }`} />
      </div>
    </div>
  );
}
