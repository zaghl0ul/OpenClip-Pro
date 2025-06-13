import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Play,
  Edit,
  Download,
  Trash2,
  Share2,
  Grid,
  List,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreVertical,
  Clock,
  Eye,
  Star,
  Brain,
  Target,
  Sparkles
} from 'lucide-react';
import useProjectStore from '../stores/projectStore';
import { useErrorHandler } from '../hooks/useErrorHandler';
import apiClient from '../utils/apiClient';
import toast from 'react-hot-toast';

const Clips = () => {
  const { projects, deleteClip } = useProjectStore();
  const { handleError, withErrorHandling } = useErrorHandler();
  
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedClip, setSelectedClip] = useState(null);
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    loadClips();
  }, [projects]);

  const loadClips = async () => {
    try {
      setLoading(true);
      // Get all clips from all projects
      const allClips = [];
      for (const project of projects) {
        if (project.clips && project.clips.length > 0) {
          const projectClips = project.clips.map(clip => ({
            ...clip,
            projectName: project.name,
            projectId: project.id
          }));
          allClips.push(...projectClips);
        }
      }
      setClips(allClips);
    } catch (error) {
      handleError(error, { operation: 'load_clips' });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedClips = clips
    .filter(clip => {
      const matchesSearch = clip.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           clip.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           clip.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === 'all') return matchesSearch;
      if (filterBy === 'high-score') return matchesSearch && clip.score >= 80;
      if (filterBy === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return matchesSearch && new Date(clip.createdAt) > oneWeekAgo;
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      
      switch (sortBy) {
        case 'name':
          return multiplier * (a.name || '').localeCompare(b.name || '');
        case 'duration':
          return multiplier * (a.duration - b.duration);
        case 'score':
          return multiplier * (a.score - b.score);
        case 'project':
          return multiplier * (a.projectName || '').localeCompare(b.projectName || '');
        case 'created':
        default:
          return multiplier * (new Date(b.createdAt) - new Date(a.createdAt));
      }
    });

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteClip = withErrorHandling(async (clipId, projectId) => {
    if (!window.confirm('Are you sure you want to delete this clip?')) {
      return;
    }

    try {
      await apiClient.deleteClip(projectId, clipId);
      
      // Update local state
      setClips(prev => prev.filter(clip => clip.id !== clipId));
      
      // Update project store
      await deleteClip(projectId, clipId);
      
      toast.success('Clip deleted successfully');
      setSelectedClip(null);
    } catch (error) {
      throw error; // Will be handled by withErrorHandling
    }
  }, { operation: 'delete_clip' });

  const handleDownloadClip = withErrorHandling(async (clip) => {
    try {
      const blob = await apiClient.downloadFile(
        `/api/projects/${clip.projectId}/clips/${clip.id}/download`,
        `${clip.name || 'clip'}.mp4`
      );
      
      toast.success('Clip download started');
      setSelectedClip(null);
    } catch (error) {
      throw error; // Will be handled by withErrorHandling
    }
  }, { operation: 'download_clip' });

  const handleShareClip = async (clip) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: clip.name || 'Video Clip',
          text: clip.description || 'Check out this video clip',
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
      setSelectedClip(null);
    } catch (error) {
      handleError(error, { operation: 'share_clip' });
    }
  };

  const ClipCard = ({ clip }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="comprehensive-glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
      whileHover={{ y: -4 }}
    >
      <div className="relative z-10">
        {/* Enhanced Clip Thumbnail with Glass */}
        <div className="aspect-video comprehensive-glass glass-button relative group overflow-hidden">
          {clip.thumbnail ? (
            <img
              src={clip.thumbnail}
              alt={clip.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-white/40" />
            </div>
          )}
          
          {/* Enhanced Play Button Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <motion.button 
              className="p-4 comprehensive-glass glass-button rounded-full text-white hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="w-8 h-8" />
            </motion.button>
          </div>
          
          {/* Enhanced Duration Badge */}
          {clip.duration && (
            <div className="absolute bottom-3 right-3 px-2 py-1 comprehensive-glass glass-button text-white text-xs rounded-lg">
              {formatDuration(clip.duration)}
            </div>
          )}
          
          {/* Enhanced Score Badge */}
          {clip.score && (
            <motion.div 
              className="absolute top-3 left-3 px-3 py-1 comprehensive-glass glass-button text-white text-xs rounded-lg flex items-center gap-1"
              animate={{
                boxShadow: clip.score >= 80 
                  ? ['0 0 0 rgba(34, 197, 94, 0.5)', '0 0 15px rgba(34, 197, 94, 0.8)', '0 0 0 rgba(34, 197, 94, 0.5)']
                  : ['0 0 0 rgba(251, 146, 60, 0.5)', '0 0 15px rgba(251, 146, 60, 0.8)', '0 0 0 rgba(251, 146, 60, 0.5)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="w-3 h-3" />
              {clip.score}
            </motion.div>
          )}
          
          {/* Enhanced Actions Menu */}
          <div className="absolute top-3 right-3">
            <div className="relative">
              <motion.button
                onClick={() => setSelectedClip(selectedClip === clip.id ? null : clip.id)}
                className="p-2 comprehensive-glass glass-button text-white rounded-lg hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MoreVertical className="w-4 h-4" />
              </motion.button>
              
              <AnimatePresence>
                {selectedClip === clip.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-48 comprehensive-glass rounded-lg p-2 z-20"
                  >
                    <motion.button 
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Clip
                    </motion.button>
                    <motion.button 
                      onClick={() => handleDownloadClip(clip)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </motion.button>
                    <motion.button 
                      onClick={() => handleShareClip(clip)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteClip(clip.id, clip.projectId)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 rounded-lg hover:bg-red-500/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Enhanced Clip Info with Glass Treatment */}
        <div className="p-6">
          <h3 className="font-semibold text-white text-lg mb-1 truncate">
            {clip.name || 'Untitled Clip'}
          </h3>
          
          <p className="text-sm text-white/60 mb-3">
            From: {clip.projectName}
          </p>
          
          {clip.description && (
            <p className="text-sm text-white/70 mb-4 line-clamp-2">
              {clip.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-white/50 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(clip.createdAt)}</span>
            </div>
            <div className="comprehensive-glass glass-button px-2 py-1 rounded">
              <Eye className="w-3 h-3 inline mr-1" />
              <span>0 views</span>
            </div>
          </div>
          
          {/* Enhanced Action Buttons */}
          <div className="flex gap-2">
            <motion.button 
              onClick={() => handleDownloadClip(clip)}
              className="flex-1 comprehensive-glass glass-button py-2 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              Download
            </motion.button>
            <motion.button 
              onClick={() => handleShareClip(clip)}
              className="comprehensive-glass glass-button p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ClipListItem = ({ clip }) => (
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
            <div className="w-24 h-16 comprehensive-glass glass-button rounded-lg flex items-center justify-center relative overflow-hidden">
              {clip.thumbnail ? (
                <img
                  src={clip.thumbnail}
                  alt={clip.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Video className="w-8 h-8 text-white/40" />
              )}
              {clip.duration && (
                <div className="absolute bottom-0 right-0 px-1 bg-black/70 text-white text-xs rounded-tl">
                  {formatDuration(clip.duration)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-white text-lg">
                  {clip.name || 'Untitled Clip'}
                </h3>
                {clip.score && (
                  <div className="flex items-center gap-1 px-3 py-1 comprehensive-glass glass-button text-white text-xs rounded-lg">
                    <Star className="w-3 h-3" />
                    {clip.score}
                  </div>
                )}
              </div>
              <p className="text-sm text-white/60 mb-2">
                From: {clip.projectName}
              </p>
              {clip.description && (
                <p className="text-sm text-white/70 mb-3">
                  {clip.description}
                </p>
              )}
              <div className="text-xs text-white/50">
                {formatDate(clip.createdAt)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button 
              className="p-3 comprehensive-glass glass-button text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <Play className="w-4 h-4" />
            </motion.button>
            <motion.button 
              className="p-3 comprehensive-glass glass-button text-white hover:bg-white/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <Edit className="w-4 h-4" />
            </motion.button>
            <motion.button 
              onClick={() => handleDownloadClip(clip)}
              className="p-3 comprehensive-glass glass-button text-white hover:bg-white/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <Download className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => handleDeleteClip(clip.id, clip.projectId)}
              className="p-3 comprehensive-glass glass-button text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
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
          <p className="text-white/60">Loading clips...</p>
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
                <Video className="w-10 h-10 text-indigo-300" />
                All Clips
              </h1>
              <p className="text-white/70 text-lg">
                Manage and organize all your AI-analyzed video clips in one place
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-400" />
              <span className="text-white/60">AI-Powered</span>
            </div>
          </div>
          
          {/* Enhanced Controls with Glass */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Enhanced Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search clips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 comprehensive-glass glass-button rounded-xl text-white placeholder-white/40 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all bg-transparent"
                />
              </div>
            </div>
            
            {/* Enhanced Filters and Sort */}
            <div className="flex items-center gap-3">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-3 comprehensive-glass glass-button rounded-xl text-white focus:ring-2 focus:ring-indigo-400/50 focus:outline-none bg-transparent"
              >
                <option value="all">All Clips</option>
                <option value="high-score">High Score (80+)</option>
                <option value="recent">Recent (7 days)</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 comprehensive-glass glass-button rounded-xl text-white focus:ring-2 focus:ring-indigo-400/50 focus:outline-none bg-transparent"
              >
                <option value="created">Date Created</option>
                <option value="name">Name</option>
                <option value="duration">Duration</option>
                <option value="score">Score</option>
                <option value="project">Project</option>
              </select>
              
              <motion.button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-3 comprehensive-glass glass-button rounded-xl hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sortOrder === 'desc' ? <SortDesc className="w-5 h-5 text-white" /> : <SortAsc className="w-5 h-5 text-white" />}
              </motion.button>

              <div className="flex comprehensive-glass glass-button rounded-xl overflow-hidden">
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-white/60'} hover:bg-indigo-500 hover:text-white transition-colors`}
                  whileHover={{ scale: 1.05 }}
                >
                  <Grid className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'text-white/60'} hover:bg-indigo-500 hover:text-white transition-colors`}
                  whileHover={{ scale: 1.05 }}
                >
                  <List className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats with Glass */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Clips', value: clips.length, icon: Video, color: 'text-blue-300' },
          { label: 'Total Duration', value: formatDuration(clips.reduce((acc, clip) => acc + (clip.duration || 0), 0)), icon: Clock, color: 'text-green-300' },
          { label: 'Avg Score', value: clips.length > 0 ? Math.round(clips.reduce((acc, clip) => acc + (clip.score || 0), 0) / clips.length) : 0, icon: Star, color: 'text-yellow-300' },
          { label: 'Projects', value: new Set(clips.map(clip => clip.projectId)).size, icon: Target, color: 'text-purple-300' }
        ].map((stat, index) => (
          <motion.div 
            key={stat.label}
            className="comprehensive-glass rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white/60">{stat.label}</h3>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
        
      {/* Enhanced Clips Grid/List */}
      {filteredAndSortedClips.length === 0 ? (
        <motion.div 
          className="comprehensive-glass rounded-2xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative z-10">
            <Video className="w-20 h-20 text-white/40 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-3">
              {searchTerm || filterBy !== 'all' ? 'No clips found' : 'No clips yet'}
            </h3>
            <p className="text-white/60 max-w-md mx-auto">
              {searchTerm || filterBy !== 'all' 
                ? 'Try adjusting your search or filter criteria to find what you\'re looking for'
                : 'Create a project and analyze a video with AI to generate clips automatically'
              }
            </p>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredAndSortedClips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredAndSortedClips.map((clip) => (
                <ClipListItem key={clip.id} clip={clip} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Clips;