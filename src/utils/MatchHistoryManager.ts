import { MatchResult } from '@/types';

export interface MatchHistoryEntry {
  id: string;
  timestamp: string;
  result: MatchResult;
  summary: {
    gameName: string;
    player1Name: string;
    player2Name: string;
    winner: string | null;
    duration: number;
    moveCount: number;
  };
}

export class MatchHistoryManager {
  private static readonly STORAGE_KEY = 'llm-arena-match-history';
  private static readonly MAX_ENTRIES = 100; 

  static saveMatch(result: MatchResult): string {
    const entry: MatchHistoryEntry = {
      id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      result,
      summary: {
        gameName: result.gameConfig.engine.name,
        player1Name: result.gameConfig.player1.name,
        player2Name: result.gameConfig.player2.name,
        winner: result.finalState.winner 
          ? (result.finalState.winner === 'player1' 
              ? result.gameConfig.player1.name 
              : result.gameConfig.player2.name)
          : null,
        duration: result.duration,
        moveCount: result.moveCount
      }
    };

    const history = this.getHistory();
    history.unshift(entry); 

    
    if (history.length > this.MAX_ENTRIES) {
      history.splice(this.MAX_ENTRIES);
    }

    this.saveHistory(history);
    return entry.id;
  }

  static getHistory(): MatchHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load match history:', error);
    }
    return [];
  }

  static getMatch(id: string): MatchHistoryEntry | null {
    const history = this.getHistory();
    return history.find(entry => entry.id === id) || null;
  }

  static deleteMatch(id: string): boolean {
    const history = this.getHistory();
    const index = history.findIndex(entry => entry.id === id);
    
    if (index !== -1) {
      history.splice(index, 1);
      this.saveHistory(history);
      return true;
    }
    
    return false;
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear match history:', error);
    }
  }

  static exportHistory(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  static importHistory(historyJson: string, merge: boolean = true): void {
    try {
      const importedHistory: MatchHistoryEntry[] = JSON.parse(historyJson);
      
      if (!Array.isArray(importedHistory)) {
        throw new Error('Invalid history format');
      }

      let finalHistory: MatchHistoryEntry[];
      
      if (merge) {
        const currentHistory = this.getHistory();
        const existingIds = new Set(currentHistory.map(entry => entry.id));
        
        
        const newEntries = importedHistory.filter(entry => !existingIds.has(entry.id));
        finalHistory = [...currentHistory, ...newEntries];
        
        
        finalHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } else {
        finalHistory = importedHistory;
      }

      
      if (finalHistory.length > this.MAX_ENTRIES) {
        finalHistory = finalHistory.slice(0, this.MAX_ENTRIES);
      }

      this.saveHistory(finalHistory);
    } catch (error) {
      throw new Error('Failed to import match history: Invalid format');
    }
  }

  static getStats(): {
    totalMatches: number;
    gameStats: Record<string, number>;
    winStats: Record<string, number>;
    averageDuration: number;
    averageMoves: number;
  } {
    const history = this.getHistory();
    
    const stats = {
      totalMatches: history.length,
      gameStats: {} as Record<string, number>,
      winStats: {} as Record<string, number>,
      averageDuration: 0,
      averageMoves: 0
    };

    if (history.length === 0) {
      return stats;
    }

    let totalDuration = 0;
    let totalMoves = 0;

    history.forEach(entry => {
      
      const gameName = entry.summary.gameName;
      stats.gameStats[gameName] = (stats.gameStats[gameName] || 0) + 1;

      
      const winner = entry.summary.winner || 'Draw';
      stats.winStats[winner] = (stats.winStats[winner] || 0) + 1;

      
      totalDuration += entry.summary.duration;
      totalMoves += entry.summary.moveCount;
    });

    stats.averageDuration = Math.round(totalDuration / history.length);
    stats.averageMoves = Math.round(totalMoves / history.length);

    return stats;
  }

  private static saveHistory(history: MatchHistoryEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save match history:', error);
      throw new Error('Failed to save match history. Storage may be full.');
    }
  }

  static searchHistory(query: string): MatchHistoryEntry[] {
    const history = this.getHistory();
    const lowerQuery = query.toLowerCase();

    return history.filter(entry => 
      entry.summary.gameName.toLowerCase().includes(lowerQuery) ||
      entry.summary.player1Name.toLowerCase().includes(lowerQuery) ||
      entry.summary.player2Name.toLowerCase().includes(lowerQuery) ||
      (entry.summary.winner && entry.summary.winner.toLowerCase().includes(lowerQuery))
    );
  }

  static getRecentMatches(limit: number = 10): MatchHistoryEntry[] {
    const history = this.getHistory();
    return history.slice(0, limit);
  }
}
