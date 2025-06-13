import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  Clock,
  Video,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Download,
  Brain,
  Target,
  Sparkles
} from 'lucide-react';
import useProjectStore from '../stores/projectStore';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';

const Projects = () => {
  const {
    projects,
    isLoading,
    deleteProject,
    initialize
  } = useProjectStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === 'all') return matchesSearch;
      if (filterBy === 'active') return matchesSearch && project.status === 'active';
      if (filterBy === 'completed') return matchesSearch && project.status === 'completed';
      if (filterBy === 'processing') return matchesSearch && project.status === 'processing';
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'updated') return new Date(b.updatedAt) - new Date(a.updatedAt);
      return 0;
    });

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'processing': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'error': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const ProjectCard = ({ project }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="comprehensive-glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
      whileHover={{ y: -4 }}
    >
      <div className="relative z-10">
        {/* Project Thumbnail with Glass Enhancement */}
        <div className="aspect-video comprehensive-glass glass-button relative overflow-hidden">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-white/40" />
            </div>
          )}
          
          {/* Enhanced Status Badge with Glass */}
          <div className="absolute top-3 left-3">
            <motion.span 
              className={`px-3 py-1 rounded-full text-xs font-medium comprehensive-glass glass-button border ${getStatusColor(project.status)}`}
              whileHover={{ scale: 1.05 }}
            >
              {project.status}
            </motion.span>
          </div>
          
          {/* Enhanced Actions Menu */}
          <div className="absolute top-3 right-3">
            <div className="relative">
              <motion.button
                onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                className="p-2 comprehensive-glass glass-button text-white rounded-lg hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MoreVertical className="w-4 h-4" />
              </motion.button>
              
              <AnimatePresence>
                {selectedProject === project.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-48 comprehensive-glass rounded-lg p-2 z-20"
                  >
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Project
                    </Link>
                    <motion.button
                      onClick={() => handleDeleteProject(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 rounded-lg hover:bg-red-500/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Project
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Enhanced Project Info with Glass Treatment */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-white text-lg truncate">
              {project.name}
            </h3>
          </div>
          
          {project.description && (
            <p className="text-sm text-white/70 mb-4 line-clamp-2">
              {project.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-white/50 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(project.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(project.updatedAt)}</span>
            </div>
          </div>
          
          {/* Enhanced Stats with Glass Pills */}
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center gap-3">
              <div className="comprehensive-glass glass-button px-2 py-1 rounded-lg">
                <span className="text-white/80">{project.videos?.length || 0} videos</span>
              </div>
              <div className="comprehensive-glass glass-button px-2 py-1 rounded-lg">
                <span className="text-white/80">{project.clips?.length || 0} clips</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Action Button */}
          <Link
            to={`/projects/${project.id}`}
            className="w-full"
          >
            <motion.div
              className="w-full comprehensive-glass glass-button py-3 rounded-xl text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-4 h-4" />
              Open Project
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );

  const ProjectListItem = ({ project }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="comprehensive-glass rounded-xl p-6 hover:bg-white/10 transition-all"
      whileHover={{ scale: 1.01 }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <div className="w-20 h-14 comprehensive-glass glass-button rounded-lg flex items-center justify-center overflow-hidden">
              {project.thumbnail ? (
                <img
                  src={project.thumbnail}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Video className="w-8 h-8 text-white/40" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-white text-lg">
                  {project.name}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium comprehensive-glass glass-button border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              
              {project.description && (
                <p className="text-sm text-white/70 mb-3">
                  {project.description}
                </p>
              )}
              
              <div className="flex items-center gap-6 text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <div className="comprehensive-glass glass-button px-2 py-1 rounded">
                    <span>{project.videos?.length || 0} videos</span>
                  </div>
                  <div className="comprehensive-glass glass-button px-2 py-1 rounded">
                    <span>{project.clips?.length || 0} clips</span>
                  </div>
                </div>
                <span>Created {formatDate(project.createdAt)}</span>
                <span>Updated {formatDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              to={`/projects/${project.id}`}
              className="p-3 comprehensive-glass glass-button text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <motion.button
              onClick={() => handleDeleteProject(project.id)}
              className="p-3 comprehensive-glass glass-button text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Brain className="w-full h-full text-indigo-400" />
          </motion.div>
          <p className="text-white/60">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Glass */}
      <motion.div 
        className="comprehensive-glass rounded-2xl p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FolderOpen className="w-10 h-10 text-indigo-300" />
                Projects
              </h1>
              <p className="text-white/70 text-lg">
                Manage your video analysis projects with AI-powered insights
              </p>
            </div>
            
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg backdrop-blur-sm"
              whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              New Project
            </motion.button>
          </div>
          
          {/* Enhanced Filters and Search with Glass */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 comprehensive-glass glass-button rounded-xl text-white placeholder-white/40 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all bg-transparent"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-3 comprehensive-glass glass-button rounded-xl text-white focus:ring-2 focus:ring-indigo-400/50 focus:outline-none bg-transparent"
              >
                <option value="all">All Projects</option>
                <option value="active">Active</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 comprehensive-glass glass-button rounded-xl text-white focus:ring-2 focus:ring-indigo-400/50 focus:outline-none bg-transparent"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="name">Name</option>
              </select>
              
              <div className="flex comprehensive-glass glass-button rounded-xl overflow-hidden">
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-white/60'} hover:bg-indigo-500 hover:text-white transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Grid className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'text-white/60'} hover:bg-indigo-500 hover:text-white transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <List className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Enhanced Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <motion.div 
          className="comprehensive-glass rounded-2xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative z-10">
            <FolderOpen className="w-20 h-20 text-white/40 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-3">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms or filters to find what you\'re looking for'
                : 'Create your first project to get started with AI-powered video analysis and editing'
              }
            </p>
            {!searchTerm && (
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium transition-all mx-auto shadow-lg backdrop-blur-sm"
                whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                Create Your First Project
              </motion.button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          layout
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }
        >
          <AnimatePresence>
            {filteredProjects.map(project => (
              viewMode === 'grid' 
                ? <ProjectCard key={project.id} project={project} />
                : <ProjectListItem key={project.id} project={project} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Enhanced Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={(project) => {
          console.log('Project created callback called with project:', project)
          initialize();
        }}
      />
    </div>
  );
};

export default Projects;