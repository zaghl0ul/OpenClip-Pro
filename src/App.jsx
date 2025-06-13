import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Clips from './pages/Clips';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import './index.css';

function App() {
  useEffect(() => {
    // Track cursor position for light effect and glass hover effects
    const handleMouseMove = (e) => {
      // Update cursor light position
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
      
      // Update glass element hover effects
      const glassElements = document.querySelectorAll('.glass, .glass-card, .card, .btn-glass, .glass-panel');
      
      glassElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        
        // Calculate distance from cursor to element center
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow(e.clientX - elementCenterX, 2) + 
          Math.pow(e.clientY - elementCenterY, 2)
        );
        
        // Only apply glow effect if cursor is close to or within the element
        const maxDistance = Math.max(rect.width, rect.height);
        
        if (distanceFromCenter <= maxDistance * 1.5) {
          // Calculate position of cursor relative to the element
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          element.style.setProperty('--glow-x', `${x}px`);
          element.style.setProperty('--glow-y', `${y}px`);
          
          // Increase opacity based on proximity
          const proximityFactor = 1 - (distanceFromCenter / (maxDistance * 1.5));
          element.style.setProperty('--glow-opacity', proximityFactor.toFixed(2));
        } else {
          element.style.setProperty('--glow-opacity', '0');
        }
      });
    };
    
    // Track cursor position
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <Layout>
                  <Projects />
                </Layout>
              } 
            />
            <Route 
              path="/projects/:id" 
              element={
                <Layout>
                  <ProjectDetail />
                </Layout>
              } 
            />
            <Route 
              path="/clips" 
              element={
                <Layout>
                  <Clips />
                </Layout>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <Layout>
                  <Analytics />
                </Layout>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <Layout>
                  <Settings />
                </Layout>
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(22, 27, 34, 0.7)',
            backdropFilter: 'blur(16px)',
            color: '#C9D1D9',
            borderRadius: '0.5rem',
            border: '1px solid rgba(201, 209, 217, 0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#58A6FF',
              secondary: '#0D1117',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#F85149',
              secondary: '#0D1117',
            },
          },
        }}
      />
    </>
  );
}

export default App;