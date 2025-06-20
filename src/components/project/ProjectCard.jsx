import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Video,
  Clock,
  Calendar,
  Trash2,
  Edit,
  Share2,
  MoreVertical,
  Sparkles,
  FileVideo,
  Activity
} from 'lucide-react'

const ProjectCard = ({ project, onDelete, index = 0 }) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = React.useState(false)
  
  const handleClick = (e) => {
    if (!e.target.closest('.menu-trigger')) {
      navigate(`/projects/${project.id}`)
    }
  }
  
  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(project.id)
    }
    setShowMenu(false)
  }
  
  const handleShare = (e) => {
    e.stopPropagation()
    // Share functionality
    console.log('Share project:', project.id)
    setShowMenu(false)
  }
  
  const handleEdit = (e) => {
    e.stopPropagation()
    navigate(`/projects/${project.id}?edit=true`)
    setShowMenu(false)
  }
  
  const formatDate = (date) => {
    if (!date) return 'Unknown date'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  }
  
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className="glass-card group cursor-pointer relative overflow-hidden"
    >
      {/* Status Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`w-2 h-2 rounded-full ${
          project.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
          project.status === 'completed' ? 'bg-green-400' :
          project.status === 'error' ? 'bg-red-400' :
          'bg-gray-400'
        }`} />
      </div>
      
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        {project.thumbnail ? (
          <img 
            src={project.thumbnail} 
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileVideo className="w-16 h-16 text-primary/50" />
          </div>
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="menu-trigger p-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
            
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-full right-0 mt-1 w-48 bg-surface/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/10 py-1 z-20"
              >
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Project
                </button>
                <button
                  onClick={handleShare}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <hr className="my-1 border-white/10" />
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Processing Indicator */}
        {project.status === 'processing' && (
          <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1 bg-yellow-500/20 backdrop-blur-sm rounded-full">
            <Activity className="w-3 h-3 text-yellow-400 animate-pulse" />
            <span className="text-xs text-yellow-400">Processing</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        
        {project.description && (
          <p className="text-sm text-subtle mb-4 line-clamp-2">
            {project.description}
          </p>
        )}
        
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-subtle">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              <span>{project.clips?.length || 0} clips</span>
            </div>
            {project.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(project.duration)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(project.createdAt || project.created_at)}</span>
          </div>
        </div>
        
        {/* Progress Bar (if processing) */}
        {project.status === 'processing' && project.progress !== undefined && (
          <div className="mt-4">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                className="h-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            <p className="text-xs text-subtle mt-1">{project.progress}% complete</p>
          </div>
        )}
      </div>
      
      {/* Hover Effect */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"
      />
    </motion.div>
  )
}

export default ProjectCard