import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;