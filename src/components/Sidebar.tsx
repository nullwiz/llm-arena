import { Terminal, Settings, Code, Database } from 'lucide-react';

type AppView = 'selection' | 'match' | 'config' | 'what' | 'feedback' | 'bugs';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

// GitHub icon component
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const menuItems = [
  {
    id: 'selection' as AppView,
    label: 'Game Selection',
    icon: Terminal,
    description: 'Choose games and configure AI agents'
  }
];

const bottomItems = [
  {
    id: 'config' as AppView,
    label: 'Settings',
    icon: Settings,
    description: 'LLM configuration and preferences'
  }
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <div className="sidebar crt-surface">
      {}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded flex items-center justify-center mr-2 border border-gray-700">
            <Terminal className="w-4 h-4 text-gray-200" />
          </div>
          <span className="font-semibold text-gray-100">LLM Arena</span>
        </div>
      </div>

      {}
      <nav className="flex-1 py-4">
        <div className="px-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
            Today
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`sidebar-item w-full text-left ${isActive ? 'active' : ''}`}
                title={item.description}
              >
                <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>

        {}
        <div className="px-2 mt-8">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
            Help
          </div>
          <button className="sidebar-item w-full text-left" onClick={() => onViewChange('what')}>
            <Code className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="text-sm">What is this?</span>
          </button>
        </div>
      </nav>

      {}
      <div className="border-t border-gray-800 p-2">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`sidebar-item w-full text-left ${isActive ? 'active' : ''}`}
              title={item.description}
            >
              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
        
        <button className="sidebar-item w-full text-left" onClick={() => onViewChange('feedback')}>
          <Database className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="text-sm">Send Feedback</span>
        </button>

        <button className="sidebar-item w-full text-left" onClick={() => onViewChange('bugs')}>
          <Database className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="text-sm">Report Bugs</span>
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/nullwiz/llm-arena"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-item w-full text-left flex items-center hover:bg-gray-800/50 transition-colors"
          title="View source code on GitHub"
        >
          <GitHubIcon className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="text-sm">GitHub</span>
        </a>
      </div>

      {}
    </div>
  );
}
