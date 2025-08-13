import { useState } from 'react';
import { GameSelection } from './components/GameSelection';
import { MatchView } from './components/MatchView';
import { ConfigPanel } from './components/ConfigPanel';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WhatIsThis } from './components/pages/WhatIsThis';
import { SendFeedback } from './components/pages/SendFeedback';
import { ReportBugs } from './components/pages/ReportBugs';

import type { GameConfig } from './types';


type AppView = 'selection' | 'match' | 'config' | 'what' | 'feedback' | 'bugs';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('selection');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  const handleGameStart = (config: GameConfig) => {
    setGameConfig(config);
    setCurrentView('match');
  };

  const handleBackToSelection = () => {
    setCurrentView('selection');
    setGameConfig(null);
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    if (view !== 'match') {
      setGameConfig(null);
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-root min-h-screen bg-gray-950 text-gray-100 theme-cyan">
        {}
        <Sidebar currentView={currentView} onViewChange={handleViewChange} />

        {}
        <div className="main-content surface">
          {}
          <main className="p-8">
            {currentView === 'selection' && (
              <div className="max-w-6xl mx-auto">
                <GameSelection onGameStart={handleGameStart} />
              </div>
            )}
            {currentView === 'match' && gameConfig && (
              <MatchView
                gameConfig={gameConfig}
                onBack={handleBackToSelection}
              />
            )}
            {currentView === 'config' && (
              <ConfigPanel onClose={() => setCurrentView('selection')} />
            )}
            {currentView === 'what' && <WhatIsThis />}
            {currentView === 'feedback' && <SendFeedback />}
            {currentView === 'bugs' && <ReportBugs />}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
