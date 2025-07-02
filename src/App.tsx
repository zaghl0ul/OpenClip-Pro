import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import GlassEffect from './components/Common/GlassEffect';
import ErrorBoundary from './components/Common/ErrorBoundary';
import TestingPanel from './components/TestingPanel';
import LogoDisplayDemo from './components/Common/LogoDisplayDemo';

import FeedbackWidget from './components/Beta/FeedbackWidget';
import UsageTracker from './components/Beta/UsageTracker';

import { startPerformanceMonitoring, detectDevicePerformance } from './utils/performance';
import { initializeAnalytics } from './utils/analytics';
import './index.css';
import { 
  TrendingUpIcon, SparklesIcon, BrainIcon, XIcon, VideoIcon, SettingsIcon, 
  LoaderIcon, ZapIcon, ActivityIcon, CheckCircleIcon, PlayIcon, EyeIcon,
  AlertTriangleIcon, XCircleIcon, RefreshCwIcon, ClockIcon, CheckIcon,
  AlertCircleIcon, LinkIcon, TrashIcon, PlusIcon, SearchIcon, Grid3X3Icon,
  ListIcon, ArrowRightIcon, ChevronRightIcon, UploadIcon, DownloadIcon,
  ShareIcon, FileTextIcon, MoreVerticalIcon, EditIcon, UserIcon, BellIcon,
  HelpCircleIcon, MenuIcon, FolderIcon, FilmIcon, TargetIcon, PaletteIcon,
  VolumeXIcon, Volume2Icon, SkipBackIcon, SkipForwardIcon, PauseIcon,
  MaximizeIcon, ScissorsIcon, LayersIcon, TrendingDownIcon, StarIcon,
  MailIcon, SendIcon, UsersIcon, MessageSquareIcon, HomeIcon, YoutubeIcon,
  BarChart2Icon, KeyIcon, ShieldIcon, ArrowLeftIcon
} from './components/Common/icons';

// Optimized lazy loading with performance monitoring
const createOptimizedLazy = (importFn, name) => {
  return React.lazy(async () => {
    const startTime = performance.now();
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;

      if (loadTime > 1000) {
        console.warn(`Slow component load: ${name} took ${loadTime.toFixed(2)}ms`);
      }

      return module;
    } catch (error) {
      console.error(`Failed to load component ${name}:`, error);
      throw error;
    }
  });
};

// Lazy load pages with performance tracking
const Landing = createOptimizedLazy(() => import('./pages/Landing'), 'Landing');
const Dashboard = createOptimizedLazy(() => import('./pages/Dashboard'), 'Dashboard');
const Projects = createOptimizedLazy(() => import('./pages/Projects'), 'Projects');
const ProjectDetail = createOptimizedLazy(() => import('./pages/ProjectDetail'), 'ProjectDetail');
const Clips = createOptimizedLazy(() => import('./pages/Clips'), 'Clips');
const Analytics = createOptimizedLazy(() => import('./pages/Analytics'), 'Analytics');
const SettingsPage = createOptimizedLazy(() => import('./pages/SettingsPage'), 'SettingsPage');

// Lazy load heavy analysis components
const AnalysisModal = createOptimizedLazy(() => import('./components/Analysis/AnalysisModal'), 'AnalysisModal');
const AnalysisResultsPanel = createOptimizedLazy(() => import('./components/Analysis/AnalysisResultsPanel'), 'AnalysisResultsPanel');

// Optimized loading component based on device performance
const PageLoader = () => {
  const [devicePerformance] = React.useState(() => detectDevicePerformance());

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <LoaderIcon
          className={`w-8 h-8 text-primary mx-auto mb-4 ${
            devicePerformance === 'low' ? '' : 'animate-spin'
          }`}
        />
        <p className="text-gray-400">Loading...</p>
        {devicePerformance === 'low' && (
          <p className="text-xs text-gray-500 mt-2">Performance mode active</p>
        )}
      </div>
    </div>
  );
};

// Enhanced Protected Route with performance considerations
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(true); // Temporarily bypass auth
  const [isLoading, setIsLoading] = React.useState(false); // Skip loading

  // Temporarily bypass authentication check
  React.useEffect(() => {
    // Skip authentication check for now
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [performanceMode, setPerformanceMode] = React.useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Start performance monitoring early
        startPerformanceMonitoring();

        // Initialize analytics for beta tracking
        initializeAnalytics();

        // Detect device performance
        const devicePerformance = detectDevicePerformance();
        setPerformanceMode(devicePerformance === 'low');

        // Minimal delay for initialization
        await new Promise((resolve) => setTimeout(resolve, 50));

        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsInitialized(true); // Still allow app to load
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/logo-demo" element={<LogoDisplayDemo />} />
              

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Projects />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clips"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Clips />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>

        {/* Glass Effect Controller - Disabled in performance mode */}
        {!performanceMode && <GlassEffect />}

        {/* Testing Panel - Only in development */}
        {import.meta.env.DEV && <TestingPanel />}

        {/* Beta Components */}
        <UsageTracker />
        <FeedbackWidget />
      </Router>

      {/* Optimized Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: performanceMode ? 2000 : 4000, // Shorter duration in performance mode
          style: {
            background: 'rgba(13, 17, 23, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: performanceMode ? 'none' : 'blur(16px)', // Disable blur in performance mode
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}

export default App;
