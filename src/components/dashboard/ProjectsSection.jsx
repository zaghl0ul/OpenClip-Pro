import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Grid3X3, List, Search } from 'lucide-react'
import ProjectCard from '../project/ProjectCard'

const ProjectsSection = React.memo(({ 
  projects = [], 
  onCreateProject, 
  onDeleteProject, 
  isLoading = false,
  searchQuery = '',
  onSearchChange 
}) => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = React.useState('grid')
  
  // Memoize filtered and sorted projects
  const processedProjects = React.useMemo(() => {
    let filtered = projects
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = projects.filter(project => 
        project.name?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.type?.toLowerCase().includes(query)
      )
    }
    
    // Sort by updated date (most recent first)
    return filtered
      .map(project => ({
        ...project,
        // Ensure thumbnail is available from video_data
        thumbnail: project.video_data?.thumbnail_url || project.thumbnail,
        hasThumbnail: project.video_data?.has_thumbnail || false,
        // Normalize dates for sorting
        sortDate: new Date(project.updated_at || project.created_at || Date.now())
      }))
      .sort((a, b) => b.sortDate - a.sortDate)
  }, [projects, searchQuery])
  
  const handleCreateProject = React.useCallback(() => {
    if (onCreateProject) {
      onCreateProject()
    } else {
      navigate('/projects/new')
    }
  }, [onCreateProject, navigate])
  
  const handleDeleteProject = React.useCallback((projectId) => {
    if (onDeleteProject) {
      onDeleteProject(projectId)
    }
  }, [onDeleteProject])
  
  const handleSearchChange = React.useCallback((e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value)
    }
  }, [onSearchChange])
  
  const containerVariants = React.useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }), [])
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="text-subtle mt-1">
            {processedProjects.length} {processedProjects.length === 1 ? 'project' : 'projects'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-subtle" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary text-white' 
                  : 'text-subtle hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary text-white' 
                  : 'text-subtle hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Create Project Button */}
          <button
            onClick={handleCreateProject}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>
      
      {/* Projects Grid/List */}
      {processedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-subtle" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No projects found' : 'Create your first project'}
          </h3>
          <p className="text-subtle mb-6 max-w-md">
            {searchQuery 
              ? `No projects match "${searchQuery}". Try adjusting your search.`
              : 'Get started by creating a new video analysis project.'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {processedProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              index={index}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
})

ProjectsSection.displayName = 'ProjectsSection'

export default ProjectsSection