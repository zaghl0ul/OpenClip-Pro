import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FolderIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  ClockIcon,
  VideoIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  PlayIcon,
  BrainIcon,
  GridIcon,
  ListIcon,
} from '../components/Common/icons';
import useProjectStore from '../stores/projectStore';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';
import ReactDOM from 'react-dom';
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
} from '../Common/icons';

const Projects = () => {
  const { projects, isLoading, deleteProject, initialize } = useProjectStore();

  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Check if we should open the create modal from URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      // Clean up the URL
      navigate('/projects', { replace: true });
    }
  }, [location.search, navigate]);

  const filteredProjects = projects
    .filter((project) => {
      const matchesSearch =
        (project.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (project.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      if (filterBy === 'all') return matchesSearch;
      if (filterBy === 'active') return matchesSearch && project.status === 'active';
      if (filterBy === 'completed') return matchesSearch && project.status === 'completed';
      if (filterBy === 'processing') return matchesSearch && project.status === 'processing';

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'created') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'updated') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      return 0;
    });

  const handleDeleteProject = async (projectId) => {
    if (
      window.confirm('Are you sure you want to delete this project? This action cannot be undone.')
    ) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const ProjectCard = ({ project }) => (
    <div className="glass-frosted rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer" style={{ transformOrigin: 'center' }}>
      <div className="relative z-10">
        {/* Project Thumbnail with Glass Enhancement */}
        <div className="aspect-video glass-frosted glass-button relative overflow-hidden">
          {project.video_data?.thumbnail_url || project.thumbnail ? (
            <img
              src={project.video_data?.thumbnail_url || project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoIcon size={48} className="w-12 h-12 text-white/40" />
            </div>
          )}

          {/* Enhanced Status Badge with Glass */}
          <div className="absolute top-3 left-3">
            <div className="px-3 py-1 rounded-full text-xs font-medium glass-frosted glass-button border" style={{ backgroundColor: getStatusColor(project.status) }}>
              {project.status}
            </div>
          </div>

          {/* Enhanced Actions Menu */}
          <div className="absolute top-3 right-3">
            <div className="relative">
              <button
                onClick={() =>
                  setSelectedProject(selectedProject === project.id ? null : project.id)
                }
                className="p-2 glass-frosted glass-button text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                <MoreVerticalIcon size={16} className="w-4 h-4" />
              </button>

              {selectedProject === project.id &&
                ReactDOM.createPortal(
                  <div className="absolute top-full right-0 mt-2 w-48 glass-frosted rounded-lg p-2 z-[60]">
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <EditIcon size={16} className="w-4 h-4" />
                      Edit Project
                    </Link>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <TrashIcon size={16} className="w-4 h-4" />
                      Delete Project
                    </button>
                  </div>,
                  document.body
                )}
            </div>
          </div>
        </div>

        {/* Enhanced Project Info with Glass Treatment */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-white text-lg truncate">
              {project.name || 'Untitled Project'}
            </h3>
          </div>

          {project.description && (
            <p className="text-sm text-white/70 mb-4 line-clamp-2">{project.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-white/50 mb-4">
            <div className="flex items-center gap-1">
              <CalendarIcon size={12} className="w-3 h-3" />
              <span>{formatDate(project.createdAt || project.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon size={12} className="w-3 h-3" />
              <span>{formatDate(project.updatedAt || project.updated_at)}</span>
            </div>
          </div>

          {/* Enhanced Stats with Glass Pills */}
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center gap-3">
              <div className="glass-frosted glass-button px-2 py-1 rounded-lg">
                <span className="text-white/80">{project.videos?.length || 0} videos</span>
              </div>
              <div className="glass-frosted glass-button px-2 py-1 rounded-lg">
                <span className="text-white/80">{project.clips?.length || 0} clips</span>
              </div>
            </div>
          </div>

          {/* Enhanced Action Button */}
          <Link to={`/projects/${project.id}`} className="w-full">
            <div
              className="w-full glass-frosted glass-button py-3 rounded-xl text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <PlayIcon size={16} className="w-4 h-4" />
              Open Project
            </div>
          </Link>
        </div>
      </div>
    </div>
  );

  const ProjectListItem = ({ project }) => (
    <div className="glass-frosted rounded-xl p-6 hover:bg-white/10 transition-all" style={{ transformOrigin: 'center' }}>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <div className="w-20 h-14 glass-frosted glass-button rounded-lg flex items-center justify-center overflow-hidden">
              {project.video_data?.thumbnail_url || project.thumbnail ? (
                <img
                  src={project.video_data?.thumbnail_url || project.thumbnail}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <VideoIcon size={32} className="w-8 h-8 text-white/40" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-white text-lg">
                  {project.name || 'Untitled Project'}
                </h3>
                <div className="px-3 py-1 rounded-full text-xs font-medium glass-frosted glass-button border" style={{ backgroundColor: getStatusColor(project.status) }}>
                  {project.status}
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-white/70 mb-3">{project.description}</p>
              )}

              <div className="flex items-center gap-6 text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <div className="glass-frosted glass-button px-2 py-1 rounded">
                    <span>{project.videos?.length || 0} videos</span>
                  </div>
                  <div className="glass-frosted glass-button px-2 py-1 rounded">
                    <span>{project.clips?.length || 0} clips</span>
                  </div>
                </div>
                <span>Created {formatDate(project.createdAt || project.created_at)}</span>
                <span>Updated {formatDate(project.updatedAt || project.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/projects/${project.id}`}
              className="p-3 glass-frosted glass-button text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
            >
              <EditIcon size={16} className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleDeleteProject(project.id)}
              className="p-3 glass-frosted glass-button text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <TrashIcon size={16} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div size={64} className="w-16 h-16 mx-auto mb-4">
            <BrainIcon className="w-full h-full text-indigo-400" />
          </div>
          <p className="text-white/60">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Glass */}
      <div className="glass-frosted rounded-2xl p-8">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FolderIcon className="w-10 h-10 text-indigo-300" isOpen={true} />
                Projects
              </h1>
              <p className="text-white/70 text-lg">
                Manage your video analysis projects with AI-powered insights
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg backdrop-blur-sm"
            >
              <PlusIcon size={20} className="w-5 h-5" />
              New Project
            </button>
          </div>

          {/* Enhanced Filters and Search with Glass */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 glass-frosted glass-button rounded-xl text-white placeholder-white/40 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all bg-transparent"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-3 glass-frosted glass-button rounded-xl text-white focus:ring-2 focus:ring-indigo-400/50 focus:outline-none bg-transparent"
              >
                <option value="all">All Projects</option>
                <option value="active">Active</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 glass-frosted glass-button rounded-xl text-white focus:ring-2 focus:ring-indigo-400/50 focus:outline-none bg-transparent"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="name">Name</option>
              </select>

              <div className="flex glass-frosted glass-button rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-white/60'} hover:bg-indigo-500 hover:text-white transition-colors`}
                >
                  <GridIcon size={20} className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'text-white/60'} hover:bg-indigo-500 hover:text-white transition-colors`}
                >
                  <ListIcon size={20} className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="glass-frosted rounded-2xl p-12 text-center">
          <div className="relative z-10">
            <FolderIcon className="w-20 h-20 text-white/40 mx-auto mb-6" isOpen={true} />
            <h3 className="text-2xl font-semibold text-white mb-3">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              {searchTerm
                ? "Try adjusting your search terms or filters to find what you're looking for"
                : 'Create your first project to get started with AI-powered video analysis and editing'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium transition-all mx-auto shadow-lg backdrop-blur-sm"
              >
                <PlusIcon size={20} className="w-5 h-5" />
                Create Your First Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredProjects.map((project, index) =>
            viewMode === 'grid' ? (
              <ProjectCard key={`grid-${project.id}-${index}`} project={project} />
            ) : (
              <ProjectListItem key={`list-${project.id}-${index}`} project={project} />
            )
          )}
        </div>
      )}

      {/* Enhanced Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={(_project) => {
          initialize();
        }}
      />
    </div>
  );
};

export default Projects;
