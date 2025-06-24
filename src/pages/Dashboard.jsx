import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video,
  Upload,
  TrendingUp,
  Clock,
  Play,
  Plus,
  Sparkles,
  Brain,
  Target,
  Zap,
  Coffee,
  ChevronRight,
  BarChart3,
  Calendar,
  AlertCircle,
  Loader,
} from 'lucide-react';
import useProjectStore from '../stores/projectStore';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, getProjectStats, loadProjects, isLoading, error } = useProjectStore();
  const [timeGreeting, setTimeGreeting] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const stats = getProjectStats
    ? getProjectStats()
    : {
        totalProjects: 0,
        totalClips: 0,
        completedProjects: 0,
        processingProjects: 0,
      };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting('Good morning');
    else if (hour < 18) setTimeGreeting('Good afternoon');
    else setTimeGreeting('Good evening');
  }, []);

  // Proper authentication check
  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = async () => {
      try {
        const isAuth = authService.isAuthenticated();

        if (isMounted) {
          setIsAuthenticated(isAuth);

          if (!isAuth) {
            toast.error('Please log in to access the dashboard');
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          toast.error('Authentication error. Please try logging in again.');
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Load dashboard data
  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!isAuthenticated) return;

      try {
        setDashboardLoading(true);
        await loadProjects();
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        if (isMounted) {
          toast.error('Failed to load dashboard data. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setDashboardLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, loadProjects]);

  // Show loading state during authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-4">Please log in to access the dashboard</p>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading state for dashboard data
  if (dashboardLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-800 rounded w-96 animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-6 bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-600 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <div className="h-6 bg-gray-700 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-800 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="h-6 bg-gray-700 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-800 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      icon: Upload,
      label: 'Upload Video',
      description: 'Start a new project',
      action: () => navigate('/projects?create=true'),
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Brain,
      label: 'AI Analysis',
      description: 'Analyze existing videos',
      action: () => navigate('/projects?filter=unanalyzed'),
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Target,
      label: 'Create Clips',
      description: 'Generate viral clips',
      action: () => navigate('/clips'),
      color: 'from-green-500 to-green-600',
    },
  ];

  const recentProjects = projects
    .filter((p) => p.updated_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{timeGreeting}! 👋</h1>
          <p className="text-gray-400">Ready to create some viral content today?</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Projects</p>
                <p className="text-2xl font-bold text-white">{stats.totalProjects || 0}</p>
              </div>
              <Video className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Generated Clips</p>
                <p className="text-2xl font-bold text-white">{stats.totalClips || 0}</p>
              </div>
              <Play className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completedProjects || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Processing</p>
                <p className="text-2xl font-bold text-white">{stats.processingProjects || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  onClick={action.action}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-4 rounded-lg bg-gradient-to-r hover:shadow-lg transition-all duration-200 text-left group"
                  style={{
                    background: action.color
                      ? `linear-gradient(135deg, ${action.color.split(' ')[0]?.replace('from-', '') || 'blue-500'}20, ${action.color.split(' ')[2]?.replace('to-', '') || 'blue-600'}20)`
                      : 'rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <action.icon className="w-6 h-6 text-white" />
                    <div>
                      <p className="font-medium text-white">{action.label}</p>
                      <p className="text-sm text-gray-400">{action.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-white transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recent Projects
            </h2>
            {recentProjects.length > 0 ? (
              <div className="space-y-3">
                {recentProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <div className="flex-1">
                        <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                          {project.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {project.status} • {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Coffee className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No recent projects</p>
                <p className="text-sm text-gray-500">Create your first project to get started!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
