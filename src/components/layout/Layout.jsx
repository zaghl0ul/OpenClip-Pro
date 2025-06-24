import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getCurrentTheme } from '../../config/themes';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const currentTheme = getCurrentTheme();
  const isRetroTheme = currentTheme === 'retro';

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    // Close sidebar on mobile when route changes
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state based on screen size
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [location]);

  // Create a subtle background pattern
  const bgPattern = {
    backgroundImage: `
      radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.01) 2px, transparent 0),
      radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.01) 2px, transparent 0)
    `,
    backgroundSize: '100px 100px',
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={bgPattern}>
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-background to-black/20 pointer-events-none z-0"></div>

      {/* Sidebar container (hidden in retro theme) */}
      {!isRetroTheme && (
        <div className="fixed top-0 left-0 h-full z-50">
          <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
        </div>
      )}

      {/* Main content with fixed left margin */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 relative ${
          !isRetroTheme && isSidebarOpen ? 'lg:ml-64 ml-0' : !isRetroTheme ? 'ml-20' : 'ml-0'
        }`}
      >
        <Header onMenuClick={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
