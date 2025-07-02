import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedContainer from '../Common/AnimatedContainer';
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

const ProjectCard = React.memo(({ project, onDelete, index = 0 }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = React.useCallback(
    (e) => {
      if (!e.target.closest('.menu-trigger')) {
        navigate(`/projects/${project.id}`);
      }
    },
    [navigate, project.id]
  );

  const handleDelete = React.useCallback(
    (e) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete(project.id);
      }
      setShowMenu(false);
    },
    [onDelete, project.id]
  );

  const handleShare = React.useCallback(
    (e) => {
      e.stopPropagation();
      // Share functionality
      setShowMenu(false);
    },
    []
  );

  const handleEdit = React.useCallback(
    (e) => {
      e.stopPropagation();
      navigate(`/projects/${project.id}?edit=true`);
      setShowMenu(false);
    },
    [navigate, project.id]
  );

  const handleImageLoad = React.useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = React.useCallback(() => {
    setImageError(true);
  }, []);

  const formatDate = React.useCallback((date) => {
    if (!date) return 'Unknown date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const formatDuration = React.useCallback((seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const cardVariants = React.useMemo(
    () => ({
      hidden: {
        opacity: 0,
        y: 20,
        scale: 0.95,
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          delay: index * 0.1,
          duration: 0.4,
          ease: 'easeOut',
        },
      },
    }),
    [index]
  );

  // Get thumbnail URL from project data
  const thumbnailUrl = React.useMemo(() => {
    // Check for the new thumbnail_url field first
    if (project.thumbnail_url) {
      return `http://localhost:8000${project.thumbnail_url}`;
    }

    // Fallback to video_data.thumbnail_url if available
    if (project.video_data?.thumbnail_url) {
      return `http://localhost:8000${project.video_data.thumbnail_url}`;
    }

    // No thumbnail available
    return null;
  }, [project.thumbnail_url, project.video_data?.thumbnail_url]);

  const hasThumbnail = thumbnailUrl && !imageError;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⟳';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  return (
    <AnimatedContainer
      animation="scaleIn"
      delay={index * 100}
      trigger="scroll"
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="glass-card rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 relative">
        {/* Enhanced Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <PlayIcon size={48} className="w-12 h-12 text-white/40" />
            </div>
          )}
          
          {/* Enhanced Overlay */}
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => navigate(`/projects/${project.id}`)}
                className="glass-button p-4 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 transform hover:scale-110"
                aria-label="View project"
              >
                <EyeIcon size={24} className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Enhanced Status Badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
            <span className="mr-1">{getStatusIcon(project.status)}</span>
            {project.status}
          </div>

          {/* Enhanced Action Menu */}
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="glass-button p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-all duration-200"
              aria-label="Project options"
            >
              <MoreVerticalIcon size={16} className="w-4 h-4 text-white" />
            </button>
            
            {showMenu &&
              ReactDOM.createPortal(
                <div className="absolute right-0 top-full mt-2 glass-prism rounded-lg p-2 min-w-[160px] z-[60]">
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                  >
                    <EditIcon size={16} className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                  >
                    <ShareIcon size={16} className="w-4 h-4" />
                    Share
                  </button>
                  <hr className="border-white/10 my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300"
                  >
                    <TrashIcon size={16} className="w-4 h-4" />
                    Delete
                  </button>
                </div>,
                document.body
              )}
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors duration-200 line-clamp-2">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-white/60 text-sm mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          {/* Enhanced Metadata */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-white/60">
              <div className="flex items-center gap-1">
                <VideoIcon size={16} className="w-4 h-4" />
                <span>{project.clips?.length || 0} clips</span>
              </div>
              {project.duration && (
                <div className="flex items-center gap-1">
                  <ClockIcon size={16} className="w-4 h-4" />
                  <span>{formatDuration(project.duration)}</span>
                </div>
              )}
            </div>
            
            {/* Enhanced Stats */}
            <div className="flex items-center gap-2">
              {project.status === 'processing' && project.progress !== undefined && (
                <div className="flex items-center gap-1">
                  <ActivityIcon size={16} className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span className="text-xs text-yellow-400">Processing</span>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Progress Bar for Processing Projects */}
          {project.status === 'processing' && project.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Processing...</span>
                <span>{project.progress}% complete</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedContainer>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;
