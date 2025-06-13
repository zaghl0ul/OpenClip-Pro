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
  ChevronRight
} from 'lucide-react'
import useProjectStore from '../stores/projectStore'

const Dashboard = () => {
  const navigate = useNavigate()
  const { projects, getProjectStats } = useProjectStore()
  const [timeGreeting, setTimeGreeting] = useState('')
  const stats = getProjectStats()
  
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeGreeting('Good morning')
    else if (hour < 18) setTimeGreeting('Good afternoon')
    else setTimeGreeting('Good evening')
  }, [])
  
  const handleCreateProject = () => {
    navigate('/projects?create=true')
  }
  
  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white">{timeGreeting}, Creator!</h1>
        <p className="text-lg text-subtle mt-1">Ready to start a new project?</p>
      </motion.div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div 
          onClick={() => navigate('/projects?create=true')}
          className="card lg:col-span-1 cursor-pointer"
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-lg">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-white">New Project</h3>
              <p className="text-sm text-subtle">Start from scratch</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          onClick={() => navigate('/projects')}
          className="card lg:col-span-1 cursor-pointer"
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-lg">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Upload Video</h3>
              <p className="text-sm text-subtle">Import your video files</p>
            </div>
          </div>
        </motion.div>

        {/* Recent Projects */}
        <motion.div className="card md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
            {projects.length > 3 && (
              <button
                onClick={() => navigate('/projects')}
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </button>
            )}
          </div>
          
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-subtle/50 mx-auto mb-3" />
              <p className="text-subtle mb-4">No projects yet</p>
              <button
                onClick={() => navigate('/projects?create=true')}
                className="btn btn-secondary"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 3).map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.01, x: 4 }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="glass-effect p-4 rounded-md cursor-pointer border border-transparent hover:border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{project.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-subtle">
                        <span>{project.clips?.length || 0} clips</span>
                        <span>•</span>
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-subtle" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard