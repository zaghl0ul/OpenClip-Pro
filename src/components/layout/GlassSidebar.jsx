import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Folder,
  Film,
  BarChart3,
  Settings,
  X,
  Video,
  TrendingUp,
  Target,
  Brain,
} from 'lucide-react';
import useProjectStore from '../../stores/projectStore';

const GlassSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects } = useProjectStore();

  const navigationItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      active: location.pathname === '/dashboard',
    },
    {
      icon: Folder,
      label: 'Projects',
      path: '/projects',
      active: location.pathname === '/projects',
    },
    { icon: Film, label: 'Clips', path: '/clips', active: location.pathname === '/clips' },
    {
      icon: BarChart3,
      label: 'Analytics',
      path: '/analytics',
      active: location.pathname === '/analytics',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      active: location.pathname === '/settings',
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  // Calculate real project statistics
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'active').length,
    totalClips: projects.reduce((sum, p) => sum + (p.clips?.length || 0), 0),
    completedProjects: projects.filter((p) => p.status === 'completed').length,
  };

  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'tween',
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    closed: {
      x: -300,
      opacity: 0,
      transition: {
        type: 'tween',
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.div
          className={`glass-frosted fixed left-4 top-20 bottom-4 w-64 rounded-2xl p-6 z-40 gpu-accelerated ${
            isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } transition-transform lg:transition-none`}
          variants={sidebarVariants}
          initial="closed"
          animate="open"
          exit="closed"
        >
          <div className="relative z-10">
            {/* Close button for mobile */}
            <button
              className="lg:hidden absolute top-4 right-4 glass-frosted rounded-lg p-2 text-white hover:bg-white/10 transition-colors"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Navigation */}
            <nav className="space-y-2 mb-8">
              {navigationItems.map((item, index) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group relative overflow-hidden ${
                    item.active
                      ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  {/* Active indicator */}
                  {item.active && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl"
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  <item.icon
                    className={`w-5 h-5 relative z-10 ${item.active ? 'text-indigo-300' : ''}`}
                  />
                  <span className="font-medium relative z-10">{item.label}</span>

                  {item.active && (
                    <div className="ml-auto w-2 h-2 bg-indigo-400 rounded-full relative z-10" />
                  )}
                </button>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
                Overview
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="glass-frosted rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Folder className="w-4 h-4 text-indigo-300" />
                    <span className="text-xs text-white/60">Projects</span>
                  </div>
                  <p className="text-lg font-bold text-white">{stats.totalProjects}</p>
                </div>

                <div className="glass-frosted rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Film className="w-4 h-4 text-purple-300" />
                    <span className="text-xs text-white/60">Clips</span>
                  </div>
                  <p className="text-lg font-bold text-white">{stats.totalClips}</p>
                </div>

                <div className="glass-frosted rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-300" />
                    <span className="text-xs text-white/60">Active</span>
                  </div>
                  <p className="text-lg font-bold text-white">{stats.activeProjects}</p>
                </div>

                <div className="glass-frosted rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-blue-300" />
                    <span className="text-xs text-white/60">Done</span>
                  </div>
                  <p className="text-lg font-bold text-white">{stats.completedProjects}</p>
                </div>
              </div>
            </div>

            {/* AI Assistant Preview */}
            <div className="glass-frosted rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">AI Assistant</p>
                  <p className="text-xs text-white/60">Configure in settings</p>
                </div>
              </div>

              <p className="text-sm text-white/80 mb-3">
                Configure AI providers in settings to enable video analysis.
              </p>

              <button
                onClick={() => handleNavigation('/settings')}
                className="w-full px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors"
              >
                Configure AI
              </button>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
                Recent Activity
              </h3>

              <div className="space-y-2">
                {projects.slice(0, 3).map((project, index) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => handleNavigation(`/projects/${project.id}`)}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        project.status === 'active'
                          ? 'bg-green-400'
                          : project.status === 'analyzing'
                            ? 'bg-yellow-400'
                            : 'bg-blue-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{project.name}</p>
                      <p className="text-xs text-white/60">{project.clips?.length || 0} clips</p>
                    </div>
                  </div>
                ))}

                {projects.length === 0 && (
                  <div className="text-center py-4">
                    <Video className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-sm text-white/60">No projects yet</p>
                    <p className="text-xs text-white/40">Create your first project</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default GlassSidebar;
