import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Calendar
} from 'lucide-react'
import useProjectStore from '../stores/projectStore'
import authService from '../services/authService'

const Dashboard = () => {
  const navigate = useNavigate()
  const { projects, getProjectStats, loadProjects } = useProjectStore()
  const [timeGreeting, setTimeGreeting] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const stats = getProjectStats ? getProjectStats() : {
    totalProjects: 0,
    totalClips: 0,
    completedProjects: 0,
    processingProjects: 0
  }
  
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeGreeting('Good morning')
    else if (hour < 18) setTimeGreeting('Good afternoon')
    else setTimeGreeting('Good evening')
  }, [])

  // Auto-login for development (memoized)
  useEffect(() => {
    let isMounted = true;
    
    const autoLogin = async () => {
      try {
        if (!authService.isAuthenticated()) {
          const result = await authService.login({
            email: 'admin@openclippro.com',
            password: 'admin123!'
          })
          
          if (isMounted) {
            if (result.success) {
              setIsAuthenticated(true)
            } else {
              setIsAuthenticated(false)
            }
          }
        } else {
          if (isMounted) {
            setIsAuthenticated(true)
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsAuthenticated(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    autoLogin()
    
    return () => {
      isMounted = false;
    };
  }, [])

  // Load projects when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadProjects().catch(error => {
        console.error('Failed to load projects:', error)
      })
    }
  }, [isAuthenticated, isLoading, loadProjects])
  
  const handleCreateProject = () => {
    navigate('/projects?create=true')
  }
  
  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  // Show loading screen while authenticating
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Sparkles className="w-full h-full text-primary" />
          </motion.div>
          <p className="text-white/60">Initializing OpenClip Pro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-frosted p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <h1 className="text-3xl font-bold text-white">{timeGreeting}, Creator!</h1>
        <p className="text-lg text-subtle mt-1 max-w-lg">Welcome to OpenClip. Create, edit, and share your video clips with AI assistance.</p>
        
        <div className="flex flex-wrap gap-4 mt-6">
          <button 
            onClick={() => navigate('/projects?create=true')}
            className="btn-glass px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
          
          <button 
            onClick={() => navigate('/projects')}
            className="btn-glass px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Browse Projects
          </button>
        </div>
      </motion.div>
      
      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="glass-frosted p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-subtle">Total Projects</div>
              <div className="text-2xl font-bold text-white">{stats.totalProjects || 0}</div>
            </div>
          </div>
        </div>
        
        <div className="glass-frosted p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Play className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-subtle">Total Clips</div>
              <div className="text-2xl font-bold text-white">{stats.totalClips || 0}</div>
            </div>
          </div>
        </div>
        
        <div className="glass-frosted p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-subtle">Completed</div>
              <div className="text-2xl font-bold text-white">{stats.completedProjects || 0}</div>
            </div>
          </div>
        </div>
        
        <div className="glass-frosted p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-subtle">Processing</div>
              <div className="text-2xl font-bold text-white">{stats.processingProjects || 0}</div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card lg:col-span-1"
        >
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          </div>
          
          <div className="p-2">
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => navigate('/projects?create=true')}
              className="w-full text-left p-3 rounded-lg hover:bg-surface flex items-center gap-3"
            >
              <div className="bg-primary/10 p-2 rounded-lg">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-white">New Project</h3>
                <p className="text-xs text-subtle">Start from scratch</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => navigate('/projects')}
              className="w-full text-left p-3 rounded-lg hover:bg-surface flex items-center gap-3"
            >
              <div className="bg-primary/10 p-2 rounded-lg">
                <Upload className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-white">Upload Video</h3>
                <p className="text-xs text-subtle">Import your video files</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => navigate('/clips')}
              className="w-full text-left p-3 rounded-lg hover:bg-surface flex items-center gap-3"
            >
              <div className="bg-primary/10 p-2 rounded-lg">
                <Play className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-white">View All Clips</h3>
                <p className="text-xs text-subtle">Browse your content</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => navigate('/analytics')}
              className="w-full text-left p-3 rounded-lg hover:bg-surface flex items-center gap-3"
            >
              <div className="bg-primary/10 p-2 rounded-lg">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-white">Analytics</h3>
                <p className="text-xs text-subtle">View performance data</p>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Projects */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-frosted lg:col-span-2"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
            {projects && projects.length > 0 && (
              <button
                onClick={() => navigate('/projects')}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="p-4">
            {!projects || !Array.isArray(projects) || projects.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-subtle mb-4">No projects yet</p>
                <button
                  onClick={() => navigate('/projects?create=true')}
                  className="btn-glass"
                >
                  Create Your First Project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 4).map((project, index) => (
                  <motion.div
                    key={`${project.id}-${index}`}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="p-3 rounded-lg hover:bg-surface cursor-pointer border border-transparent hover:border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{project.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-subtle">
                          <div className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            <span>{project.clips?.length || 0} clips</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(project.createdAt || project.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        project.status === 'completed' ? 'bg-green-500' :
                        project.status === 'processing' ? 'bg-yellow-500' :
                        project.status === 'error' ? 'bg-red-500' :
                        'bg-primary'
                      }`}></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard