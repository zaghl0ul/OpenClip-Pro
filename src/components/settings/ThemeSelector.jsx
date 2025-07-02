import React from 'react';
import { useThemeStore } from '../../stores/settingsStore';

const ThemeSelector = () => {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="space-y-2">
      <label className="block text-white/80 font-medium mb-1">Theme</label>
      <div className="flex gap-4">
        <button
          className={`glass-button px-4 py-2 rounded-lg font-medium transition-all duration-200 ${theme === 'default' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          onClick={() => setTheme('default')}
          aria-pressed={theme === 'default'}
        >
          Default
        </button>
        <button
          className={`glass-button px-4 py-2 rounded-lg font-medium transition-all duration-200 ${theme === 'win98' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          onClick={() => setTheme('win98')}
          aria-pressed={theme === 'win98'}
        >
          Windows 98
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector; 