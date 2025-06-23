import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Clips from './pages/Clips';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/SettingsPage';
import GlassEffect from './components/Common/GlassEffect';
import ErrorBoundary from './components/Common/ErrorBoundary';
import TestingPanel from './components/TestingPanel';
import LogoDisplayDemo from './components/Common/LogoDisplayDemo';
import authService from './services/authService';
import './index.css';

function App() {
  useEffect(() => {
    // Initialize authentication for development
    authService.ensureAuthenticated().catch(error => {
      console.error('Authentication initialization failed:', error);
    });
  }, []);

  useEffect(() => {
    // Track cursor position for light effect and glass hover effects
    const handleMouseMove = (e) => {
      // Update cursor light position
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
      
      // Update glass element hover effects
      const glassElements = document.querySelectorAll('.glass, .glass-card, .card, .btn-glass, .glass-panel, .glass-minimal, .glass-prism, .glass-shine, .glass-frosted');
      
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
          
          // For glass-prism elements, create subtle edge refraction effect with rainbow hint
          if (element.classList.contains('glass-prism')) {
            // Calculate distances to each edge
            const distanceToLeft = x;
            const distanceToRight = rect.width - x;
            const distanceToTop = y;
            const distanceToBottom = rect.height - y;
            
            // Find the closest edge
            const edgeDistances = [
              { edge: 'left', distance: distanceToLeft, x: 0, y: y, angle: 0 },
              { edge: 'right', distance: distanceToRight, x: rect.width, y: y, angle: 180 },
              { edge: 'top', distance: distanceToTop, x: x, y: 0, angle: 90 },
              { edge: 'bottom', distance: distanceToBottom, x: x, y: rect.height, angle: 270 }
            ];
            
            // Sort by distance to find the closest edge
            edgeDistances.sort((a, b) => a.distance - b.distance);
            const closestEdge = edgeDistances[0];
            
            // Only activate effect when cursor is very close to an edge (more subtle threshold)
            const baseThreshold = Math.min(12, rect.width * 0.08, rect.height * 0.08);
            
            if (closestEdge.distance < baseThreshold) {
              // Calculate intensity based on proximity to edge
              const edgeIntensity = Math.pow(1 - (closestEdge.distance / baseThreshold), 1.8); // Steeper falloff
              
              // Position the highlight at the edge closest to cursor
              element.style.setProperty('--edge-x', `${closestEdge.x}px`);
              element.style.setProperty('--edge-y', `${closestEdge.y}px`);
              
              // Set angle perpendicular to the edge
              element.style.setProperty('--edge-angle', `${closestEdge.angle}deg`);
              
              // Set a very small radius for a subtle highlight
              // Different sizes for vertical vs horizontal edges
              const isVertical = closestEdge.edge === 'left' || closestEdge.edge === 'right';
              const edgeRadius = isVertical ? Math.min(rect.height * 0.2, 40) : Math.min(rect.width * 0.2, 40);
              const edgeThin = Math.min(baseThreshold * 0.8, 6); // Very thin highlight
              
              element.style.setProperty('--edge-radius', `${edgeRadius}px`);
              element.style.setProperty('--edge-thin', `${edgeThin}px`);
              element.style.setProperty('--edge-intensity', edgeIntensity.toFixed(2));
              
              // Add subtle rainbow shift based on position
              let huePosition;
              if (isVertical) {
                huePosition = y / rect.height;
              } else {
                huePosition = x / rect.width;
              }
              
              // Use current time for subtle animation
              const timeOffset = (Date.now() % 10000) / 10000; // Complete cycle every 10 seconds
              const hueShift = ((huePosition + timeOffset) * 360) % 360;
              element.style.setProperty('--edge-hue', hueShift.toFixed(0));
            } else {
              element.style.setProperty('--edge-intensity', '0');
            }
          }
          
          // For glass-shine elements, update reflection position
          if (element.classList.contains('glass-shine')) {
            const percentX = ((x / rect.width) * 100).toFixed(2);
            const percentY = ((y / rect.height) * 100).toFixed(2);
            element.style.setProperty('--shine-x', `${percentX}%`);
            element.style.setProperty('--shine-y', `${percentY}%`); 
          }
        } else {
          element.style.setProperty('--glow-opacity', '0');
          
          if (element.classList.contains('glass-prism')) {
            element.style.setProperty('--edge-intensity', '0');
          }
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
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/logo-demo" element={<LogoDisplayDemo />} />
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
                  <SettingsPage />
                </Layout>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        {/* Glass Effect Controller */}
        <GlassEffect />
        
        {/* Testing Panel - Only in development */}
        {import.meta.env.DEV && <TestingPanel />}
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
    </ErrorBoundary>
  );
}

export default App;