import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Folder,
  Settings,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  ChevronDown,
  Play,
  Scissors,
  Download,
  Users,
  Zap
} from 'lucide-react'
import useProjectStore from '../../stores/projectStore'
import toast from 'react-hot-toast'
import { useErrorHandler } from '../../hooks/useErrorHandler'
import apiClient from '../../utils/apiClient'

const Sidebar = ({ isOpen, setOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { projects, getRecentProjects, getProjectStats } = useProjectStore()
  const { handleError, withErrorHandling } = useErrorHandler()
  
  const [expandedSections, setExpandedSections] = useState({
    recent: true,
    tools: true,
    stats: false
  })
  
  const recentProjects = getRecentProjects ? getRecentProjects(5) : []
  const stats = getProjectStats ? getProjectStats() : {}
  
  const mainNavItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview & analytics'
    },
    {
      path: '/projects',
      label: 'Projects',
      icon: Folder,
      description: 'Manage your projects'
    },
    {
      path: '/clips',
      label: 'All Clips',
      icon: Play,
      description: 'Browse all clips'
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: TrendingUp,
      description: 'Performance insights'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      description: 'App configuration'
    }
  ]
  
  const handleQuickAnalyze = withErrorHandling(async () => {
    try {
      // Check if there are any projects with videos but no analysis
      const unanalyzedProjects = projects.filter(p => 
        p.video && (!p.clips || p.clips.length === 0) && p.status !== 'analyzing'
      )
      
      if (unanalyzedProjects.length === 0) {
        toast.info('No projects available for quick analysis. Upload a video first!')
        navigate('/projects')
        setOpen(false)
        return
      }

      // If there's only one project, analyze it directly
      if (unanalyzedProjects.length === 1) {
        const project = unanalyzedProjects[0]
        navigate(`/projects/${project.id}?action=analyze`)
        setOpen(false)
        return
      }

      // If multiple projects, show selection or navigate to projects page
      navigate('/projects?filter=unanalyzed')
      setOpen(false)
      toast.info('Select a project to analyze from the list')
    } catch (error) {
      throw error
    }
  }, { operation: 'quick_analyze' })

  const handleTrimClips = withErrorHandling(async () => {
    try {
      // Find projects with clips that can be trimmed
      const projectsWithClips = projects.filter(p => p.clips && p.clips.length > 0)
      
      if (projectsWithClips.length === 0) {
        toast.info('No clips available for trimming. Analyze a video first!')
        navigate('/projects')
        setOpen(false)
        return
      }

      // Navigate to clips page with trim mode
      navigate('/clips?mode=trim')
      setOpen(false)
      toast.info('Select clips to trim from the list')
    } catch (error) {
      throw error
    }
  }, { operation: 'trim_clips' })

  const handleQuickExport = withErrorHandling(async () => {
    try {
      // Find projects with completed clips
      const projectsWithClips = projects.filter(p => 
        p.clips && p.clips.length > 0 && p.status === 'completed'
      )
      
      if (projectsWithClips.length === 0) {
        toast.info('No completed projects available for export!')
        navigate('/projects')
        setOpen(false)
        return
      }

      // If there's only one project, export it directly
      if (projectsWithClips.length === 1) {
        const project = projectsWithClips[0]
        
        const exportSettings = {
          format: 'mp4',
          quality: 'high',
          includeAll: true
        }
        
        await apiClient.exportClips(project.id, exportSettings)
        toast.success(`Exporting clips from "${project.name}". You'll receive a download link shortly.`)
        setOpen(false)
        return
      }

      // If multiple projects, navigate to projects page with export filter
      navigate('/projects?filter=completed')
      setOpen(false)
      toast.info('Select a project to export from the list')
    } catch (error) {
      throw error
    }
  }, { operation: 'quick_export' })
  
  const quickTools = [
    {
      id: 'analyze',
      label: 'Quick Analyze',
      icon: Play,
      action: handleQuickAnalyze,
      description: 'Analyze unprocessed videos'
    },
    {
      id: 'trim',
      label: 'Trim Clips',
      icon: Scissors,
      action: handleTrimClips,
      description: 'Edit existing clips'
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      action: handleQuickExport,
      description: 'Download completed clips'
    }
  ]
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  // Mobile sidebar variants
  const mobileSidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  }
  
  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col glass border-r ${
          isOpen ? 'w-64' : 'w-20'
        } transition-all duration-300`}
        variants={mobileSidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
      >
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4">
            <Link
              to="/"
              className={`flex items-center gap-2 mb-6 ${!isOpen && 'justify-center'}`}
            >
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-lg">OC</span>
              </div>
              {isOpen && (
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-white">OpenClip</span>
                  <span className="text-xs text-subtle">Pro Edition</span>
                </div>
              )}
            </Link>
            
            <nav className="space-y-1">
              {mainNavItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <motion.div
                    key={item.path}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-background'
                          : 'text-subtle hover:text-secondary hover:bg-surface'
                      }`}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          setOpen(false);
                        }
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      {isOpen && <span>{item.label}</span>}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
            
            {isOpen && (
              <>
                <div className="mt-8 mb-2">
                  <button
                    onClick={() => toggleSection('tools')}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-subtle hover:text-secondary"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>Quick Tools</span>
                    </div>
                    {expandedSections.tools ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.tools && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 pr-2 py-2 space-y-1">
                          {quickTools.map((tool) => (
                            <button
                              key={tool.id}
                              onClick={tool.action}
                              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-subtle hover:text-secondary hover:bg-surface transition-colors"
                            >
                              <tool.icon className="w-4 h-4" />
                              <span>{tool.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="mb-2">
                  <button
                    onClick={() => toggleSection('recent')}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-subtle hover:text-secondary"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Recent Projects</span>
                    </div>
                    {expandedSections.recent ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.recent && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 pr-2 py-2 space-y-1">
                          {recentProjects && recentProjects.length > 0 ? (
                            recentProjects.map((project) => (
                              <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-subtle hover:text-secondary hover:bg-surface transition-colors"
                                onClick={() => {
                                  if (window.innerWidth < 1024) {
                                    setOpen(false);
                                  }
                                }}
                              >
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <span className="truncate">{project.name}</span>
                              </Link>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-subtle">
                              No recent projects
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div>
                  <button
                    onClick={() => toggleSection('stats')}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-subtle hover:text-secondary"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      <span>Quick Stats</span>
                    </div>
                    {expandedSections.stats ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.stats && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 pr-2 py-2 space-y-3">
                          {stats && Object.keys(stats).length > 0 ? (
                            <>
                              <div className="px-3 py-2 rounded-lg bg-surface">
                                <div className="text-xs text-subtle">Total Projects</div>
                                <div className="text-lg font-semibold text-white">{stats.totalProjects || 0}</div>
                              </div>
                              
                              <div className="px-3 py-2 rounded-lg bg-surface">
                                <div className="text-xs text-subtle">Total Clips</div>
                                <div className="text-lg font-semibold text-white">{stats.totalClips || 0}</div>
                              </div>
                              
                              <div className="px-3 py-2 rounded-lg bg-surface">
                                <div className="text-xs text-subtle">Processing</div>
                                <div className="text-lg font-semibold text-white">{stats.processing || 0}</div>
                              </div>
                            </>
                          ) : (
                            <div className="px-3 py-2 text-sm text-subtle">
                              No stats available
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Bottom section */}
        {isOpen && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Creator</div>
                <div className="text-xs text-subtle">Free Plan</div>
              </div>
            </div>
          </div>
        )}
      </motion.aside>
    </>
  )
}

export default Sidebar