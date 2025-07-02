import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../stores/projectStore';
import toast from 'react-hot-toast';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';

  LoaderIcon,
  AlertCircleIcon,
  UploadIcon as Upload,
  BrainIcon as Brain,
  TargetIcon as Target,
  PlusIcon,
  VideoIcon as Video,
  PlayIcon as Play,
  CheckCircleIcon as CheckCircle,
  ClockIcon,
  ZapIcon,
  ChevronRightIcon
} from '../components/Common/icons';

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, getProjectStats, loadProjects, error } = useProjectStore();
  const [timeGreeting, setTimeGreeting] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [DashboardLoading, setDashboardLoading] = useState(true);

  const stats = getProjectStats?.() || {
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

  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = async () => {
      try {
        const isAuth = true; // Temporarily bypass auth
        if (isMounted) {
          setIsAuthenticated(isAuth);
          if (!isAuth) {
            toast.error('Please log in to access the Dashboard');
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        if (isMounted) setIsAuthenticated(true);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    checkAuthentication();
    return () => { isMounted = false; };
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!isAuthenticated) return;

      try {
        setDashboardLoading(true);
        await loadProjects();
      } catch (error) {
        console.error('Failed to load Dashboard data:', error);
        if (isMounted) {
          toast.error('Failed to load Dashboard data. Please refresh the page.');
        }
      } finally {
        if (isMounted) setDashboardLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, [isAuthenticated, loadProjects]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoaderIcon size={32} className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircleIcon size={48} className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-4">Please log in to access the Dashboard</p>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (DashboardLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircleIcon size={48} className="w-12 h-12 text-error mx-auto mb-4" />
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
    <div className="min-h-screen p-6 space-y-8">
      <div className="glass-frosted rounded-2xl p-8">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-bold text-white flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                  <Brain size={24} className="w-6 h-6 text-indigo-300" />
                </div>
                {timeGreeting}, Creator!
              </h1>
              <p className="text-white/70 text-lg max-w-2xl">
                Ready to transform your videos with AI-powered analysis and clip generation
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 glass-minimal rounded-lg">
                <Target size={20} className="w-5 h-5 text-purple-400" />
                <span className="text-white/80 text-sm font-medium">AI-Powered</span>
              </div>
              
              <button
                onClick={() => navigate('/projects?create=true')}
                className="glass-button px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 group"
                aria-label="Create new project"
              >
                <PlusIcon size={24} className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Projects',
            value: stats.totalProjects,
            icon: Video,
            color: 'from-blue-500/20 to-blue-600/20',
            textColor: 'text-blue-300',
            description: 'Projects created'
          },
          {
            label: 'Total Clips',
            value: stats.totalClips,
            icon: Play,
            color: 'from-green-500/20 to-green-600/20',
            textColor: 'text-green-300',
            description: 'AI-generated clips'
          },
          {
            label: 'Completed',
            value: stats.completedProjects,
            icon: CheckCircle,
            color: 'from-emerald-500/20 to-emerald-600/20',
            textColor: 'text-emerald-300',
            description: 'Finished projects'
          },
          {
            label: 'Processing',
            value: stats.processingProjects,
            icon: ClockIcon,
            color: 'from-yellow-500/20 to-yellow-600/20',
            textColor: 'text-yellow-300',
            description: 'In progress'
          },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="glass-card p-6 group hover:scale-105 transition-all duration-300"
            role="region"
            aria-label={`${stat.label} statistics`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon size={24} className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-200">
                    {stat.value}
                  </p>
                  <p className="text-white/60 text-sm">{stat.description}</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white/90">{stat.label}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <QuickActions actions={quickActions} />
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <ClockIcon size={20} className="w-5 h-5 text-blue-400" />
            Recent Projects
          </h2>
          <div className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Video size={20} className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">{project.title}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      project.status === 'processing' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Video size={48} className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No projects yet</p>
                <button
                  onClick={() => navigate('/projects?create=true')}
                  className="btn btn-primary mt-3"
                >
                  Create Your First Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickActions = ({ actions }) => (
  <div className="glass-card p-6">
    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
      <ZapIcon size={20} className="w-5 h-5 text-yellow-400" />
      Quick Actions
    </h2>
    <div className="grid grid-cols-1 gap-4">
      {actions.map((action, index) => (
        <QuickActionButton
          key={action.label}
          {...action}
          index={index}
        />
      ))}
    </div>
  </div>
);

const QuickActionButton = ({ icon: Icon, label, description, action, color, index }) => (
  <button
    onClick={action}
    className={`glass-button w-full p-4 rounded-xl bg-gradient-to-r ${color} text-white text-left group hover:scale-[1.02] transition-all duration-300 flex items-center gap-4`}
    style={{
      animationDelay: `${index * 100}ms`,
    }}
    aria-label={`${label}: ${description}`}
  >
    <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
      <Icon size={24} className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-lg group-hover:text-white/90 transition-colors duration-200">
        {label}
      </h3>
      <p className="text-white/70 text-sm group-hover:text-white/80 transition-colors duration-200">
        {description}
      </p>
    </div>
    <ChevronRightIcon size={20} className="w-5 h-5 text-white/50 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-200" />
  </button>
);

export default Dashboard;
