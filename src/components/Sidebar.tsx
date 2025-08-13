import { Terminal, Settings, Code, Database } from 'lucide-react';

type AppView = 'selection' | 'match' | 'config' | 'what' | 'feedback' | 'bugs';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

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
      </div>

      {}
    </div>
  );
}
