import React from 'react';

const SettingsSidebar = ({ activeSection, onSectionChange }) => {
  const sections = [
    {
      id: 'api',
      name: 'API Configuration',
      icon: Key,
      description: 'Manage API keys and models',
    },
    {
      id: 'app',
      name: 'Application',
      icon: Settings,
      description: 'App preferences and themes',
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: Zap,
      description: 'Optimize processing and caching',
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      description: 'Privacy and security settings',
    },
  ];

  return (
    <div className="w-64 bg-surface border-r border-white/10 h-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Settings</h2>

        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full group flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-subtle hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-subtle group-hover:text-white'}`}
                />
                <div className="flex-1 text-left">
                  <p className="font-medium">{section.name}</p>
                  <p className={`text-xs mt-0.5 ${isActive ? 'text-primary/70' : 'text-subtle'}`}>
                    {section.description}
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default SettingsSidebar;
