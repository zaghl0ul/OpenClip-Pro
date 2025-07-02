import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useThemeStore } from './stores/settingsStore';

function ThemeInitializer() {
  const initializeTheme = useThemeStore((s) => s.initializeTheme);
  React.useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeInitializer />
    <App />
  </React.StrictMode>
);
