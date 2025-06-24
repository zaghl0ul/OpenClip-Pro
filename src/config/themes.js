// Theme configuration with multiple modern themes
export const themes = {
  dark: {
    name: 'Midnight',
    colors: {
      background: '#0D1117',
      surface: '#161B22',
      surfaceHover: '#1F2428',
      border: 'rgba(201, 209, 217, 0.1)',
      borderHover: 'rgba(201, 209, 217, 0.2)',
      primary: '#58A6FF',
      primaryHover: '#79B8FF',
      secondary: '#C9D1D9',
      subtle: '#8B949E',
      accent: '#F78166',
      success: '#56D364',
      warning: '#E3B341',
      error: '#F85149',
      gradientStart: '#1C93E3',
      gradientEnd: '#A855F7',
    },
    glass: {
      blur: '16px',
      saturation: '1.1',
      opacity: '0.65',
      hoverOpacity: '0.75',
    },
  },
  light: {
    name: 'Daylight',
    colors: {
      background: '#FFFFFF',
      surface: '#F6F8FA',
      surfaceHover: '#F0F2F5',
      border: 'rgba(31, 35, 40, 0.15)',
      borderHover: 'rgba(31, 35, 40, 0.25)',
      primary: '#0969DA',
      primaryHover: '#0860CA',
      secondary: '#24292F',
      subtle: '#57606A',
      accent: '#FB8500',
      success: '#1A7F37',
      warning: '#BF8700',
      error: '#CF222E',
      gradientStart: '#0969DA',
      gradientEnd: '#8B5CF6',
    },
    glass: {
      blur: '12px',
      saturation: '0.95',
      opacity: '0.85',
      hoverOpacity: '0.9',
    },
  },
  cyberpunk: {
    name: 'Neon Dreams',
    colors: {
      background: '#0A0E1A',
      surface: '#141927',
      surfaceHover: '#1E2437',
      border: 'rgba(255, 0, 255, 0.2)',
      borderHover: 'rgba(255, 0, 255, 0.4)',
      primary: '#00D9FF',
      primaryHover: '#00F0FF',
      secondary: '#FF00FF',
      subtle: '#8892B0',
      accent: '#FFFF00',
      success: '#00FF88',
      warning: '#FFB800',
      error: '#FF0080',
      gradientStart: '#00D9FF',
      gradientEnd: '#FF00FF',
    },
    glass: {
      blur: '20px',
      saturation: '1.5',
      opacity: '0.4',
      hoverOpacity: '0.6',
    },
  },
  aurora: {
    name: 'Northern Lights',
    colors: {
      background: '#0F172A',
      surface: '#1E293B',
      surfaceHover: '#334155',
      border: 'rgba(148, 163, 184, 0.1)',
      borderHover: 'rgba(148, 163, 184, 0.2)',
      primary: '#38BDF8',
      primaryHover: '#0EA5E9',
      secondary: '#E0E7FF',
      subtle: '#94A3B8',
      accent: '#C084FC',
      success: '#34D399',
      warning: '#FCD34D',
      error: '#F87171',
      gradientStart: '#38BDF8',
      gradientEnd: '#C084FC',
    },
    glass: {
      blur: '24px',
      saturation: '1.2',
      opacity: '0.5',
      hoverOpacity: '0.65',
    },
  },
  ocean: {
    name: 'Deep Ocean',
    colors: {
      background: '#001220',
      surface: '#002137',
      surfaceHover: '#003152',
      border: 'rgba(64, 192, 255, 0.15)',
      borderHover: 'rgba(64, 192, 255, 0.25)',
      primary: '#40C0FF',
      primaryHover: '#60D0FF',
      secondary: '#B8E0F5',
      subtle: '#6B9EBF',
      accent: '#00E5CC',
      success: '#00D68F',
      warning: '#FFB347',
      error: '#FF6B6B',
      gradientStart: '#006BA6',
      gradientEnd: '#00E5CC',
    },
    glass: {
      blur: '18px',
      saturation: '1.3',
      opacity: '0.55',
      hoverOpacity: '0.7',
    },
  },
  sunset: {
    name: 'Sunset Glow',
    colors: {
      background: '#1A0F1F',
      surface: '#2D1B2E',
      surfaceHover: '#3F2940',
      border: 'rgba(255, 119, 92, 0.15)',
      borderHover: 'rgba(255, 119, 92, 0.25)',
      primary: '#FF775C',
      primaryHover: '#FF8F7A',
      secondary: '#FFE5DB',
      subtle: '#D4A5A5',
      accent: '#FFD93D',
      success: '#6BCF7F',
      warning: '#FFB03A',
      error: '#FF4757',
      gradientStart: '#FF6B6B',
      gradientEnd: '#FFE66D',
    },
    glass: {
      blur: '16px',
      saturation: '1.4',
      opacity: '0.6',
      hoverOpacity: '0.75',
    },
  },
  forest: {
    name: 'Enchanted Forest',
    colors: {
      background: '#0C1F0C',
      surface: '#162716',
      surfaceHover: '#1F3A1F',
      border: 'rgba(134, 239, 172, 0.15)',
      borderHover: 'rgba(134, 239, 172, 0.25)',
      primary: '#4ADE80',
      primaryHover: '#86EFAC',
      secondary: '#D1FAE5',
      subtle: '#86A788',
      accent: '#FDE047',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      gradientStart: '#065F46',
      gradientEnd: '#84CC16',
    },
    glass: {
      blur: '14px',
      saturation: '1.15',
      opacity: '0.7',
      hoverOpacity: '0.8',
    },
  },
  cosmic: {
    name: 'Cosmic Void',
    colors: {
      background: '#000814',
      surface: '#001D3D',
      surfaceHover: '#003566',
      border: 'rgba(255, 209, 102, 0.15)',
      borderHover: 'rgba(255, 209, 102, 0.25)',
      primary: '#FFD166',
      primaryHover: '#FFDD85',
      secondary: '#FDF4E3',
      subtle: '#A8DADC',
      accent: '#E63946',
      success: '#06FFA5',
      warning: '#FF9F1C',
      error: '#E63946',
      gradientStart: '#003566',
      gradientEnd: '#FFD166',
    },
    glass: {
      blur: '22px',
      saturation: '1.25',
      opacity: '0.45',
      hoverOpacity: '0.6',
    },
  },
  monochrome: {
    name: 'Monochrome',
    colors: {
      background: '#000000',
      surface: '#1A1A1A',
      surfaceHover: '#2D2D2D',
      border: 'rgba(255, 255, 255, 0.1)',
      borderHover: 'rgba(255, 255, 255, 0.2)',
      primary: '#FFFFFF',
      primaryHover: '#F0F0F0',
      secondary: '#B8B8B8',
      subtle: '#666666',
      accent: '#CCCCCC',
      success: '#E0E0E0',
      warning: '#A0A0A0',
      error: '#808080',
      gradientStart: '#333333',
      gradientEnd: '#CCCCCC',
    },
    glass: {
      blur: '10px',
      saturation: '0',
      opacity: '0.8',
      hoverOpacity: '0.9',
    },
  },
  retro: {
    name: 'Windows 98',
    colors: {
      background: '#008080',
      surface: '#C0C0C0',
      surfaceHover: '#D4D0C8',
      border: 'rgba(128, 128, 128, 0.8)',
      borderHover: 'rgba(64, 64, 64, 0.9)',
      primary: '#0000FF',
      primaryHover: '#0040FF',
      secondary: '#000000',
      subtle: '#808080',
      accent: '#FF0000',
      success: '#008000',
      warning: '#FFFF00',
      error: '#FF0000',
      gradientStart: '#008080',
      gradientEnd: '#C0C0C0',
    },
    glass: {
      blur: '0px',
      saturation: '1',
      opacity: '0.95',
      hoverOpacity: '1',
    },
  },
};

// Glass effect presets
export const glassPresets = {
  minimal: {
    blur: '8px',
    opacity: '0.3',
    border: '1px solid',
    shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  frosted: {
    blur: '16px',
    opacity: '0.6',
    border: '1px solid',
    shadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  deep: {
    blur: '24px',
    opacity: '0.8',
    border: '1px solid',
    shadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
  },
  crystal: {
    blur: '20px',
    opacity: '0.4',
    border: '2px solid',
    shadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
  },
};

// Apply theme to DOM
export const applyTheme = (themeName) => {
  const theme = themes[themeName] || themes.dark;
  const root = document.documentElement;

  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Apply glass effect variables
  Object.entries(theme.glass).forEach(([key, value]) => {
    root.style.setProperty(`--glass-${key}`, value);
  });

  // Apply theme class for specific styling
  document.body.className = `theme-${themeName}`;

  // Store theme preference
  localStorage.setItem('theme', themeName);
};

// Get current theme
export const getCurrentTheme = () => {
  return localStorage.getItem('theme') || 'dark';
};

// Initialize theme on load
export const initializeTheme = () => {
  const savedTheme = getCurrentTheme();
  applyTheme(savedTheme);
};
