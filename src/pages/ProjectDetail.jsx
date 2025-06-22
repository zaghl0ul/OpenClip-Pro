import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Video, Upload, Download, Trash2,
  ChevronLeft, Clock, Film, Settings, AlertOctagon, Sparkles
} from 'lucide-react';
import useProjectStore from '../stores/projectStore';
import toast from 'react-hot-toast';
import VideoPlayer from '../components/Video/VideoPlayer';
import AnalysisModal from '../components/Analysis/AnalysisModal';
import AnalysisResultsPanel from '../components/Analysis/AnalysisResultsPanel';
import apiService from '../services/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, getProjectById, updateProject, deleteProject } = useProjectStore();
  const [project, setProject] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoPlayerRef, setVideoPlayerRef] = useState(null);
  
  useEffect(() => {
    const loadProject = async () => {
      try {
        // Try to get from backend first
        const response = await apiService.getProject(id);
        if (response?.project) {
          setProject(response.project);
          // Update local store
          updateProject(id, response.project);
        } else {
          // Fall back to local store
          const projectData = projects.find(p => p.id === id) || await getProjectById(id);
          if (projectData) {
            setProject(projectData);
          } else {
            navigate('/projects');
          }
        }
      } catch (error) {
        console.error('Error loading project:', error);
        // Fall back to local store on error
        const projectData = projects.find(p => p.id === id);
        if (projectData) {
          setProject(projectData);
        } else {
          navigate('/projects');
        }
      }
    };
    loadProject();
  }, [id, projects, getProjectById, navigate, updateProject]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !project) return;
    
    try {
      toast.loading('Uploading video file...', { id: 'upload' });
      
      // Try backend upload
      const uploadResponse = await apiService.uploadVideo(project.id, file);
      
      if (uploadResponse?.project) {
        updateProject(project.id, uploadResponse.project);
        setProject(uploadResponse.project);
        toast.success('Video uploaded successfully!', { id: 'upload' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Fallback to local storage
      const videoUrl = URL.createObjectURL(file);
      const videoData = {
        name: file.name,
        url: videoUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };
      
      updateProject(project.id, {
        video: videoData,
        status: 'uploaded'
      });
      
      setProject({
        ...project,
        video: videoData,
        status: 'uploaded'
      });
      
      toast.success('Video saved locally (offline mode)', { id: 'upload' });
    }
  };

  const handleStartAnalysis = async ({ prompt, provider }) => {
    if (!project || (!project.video && !project.video_data)) {
      toast.error('Please upload a video first');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Call backend API for analysis
      const response = await apiService.analyzeVideo(
        project.id,
        prompt,
        provider
      );
      
      if (response?.project) {
        // Update project with analysis results
        updateProject(project.id, response.project);
        setProject(response.project);
        setShowAnalysisModal(false);
        toast.success('Analysis completed successfully!');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Show specific error message
      if (error.message.includes('API key')) {
        toast.error('Please configure your API key in Settings');
      } else if (error.message.includes('limit')) {
        toast.error('API call limit reached. Please upgrade your plan.');
      } else {
        toast.error(`Analysis failed: ${error.message}`);
      }
      
      // Update project with error status
      updateProject(project.id, {
        status: 'error',
        error: error.message
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSeekTo = (seconds) => {
    if (videoPlayerRef && videoPlayerRef.seekTo) {
      videoPlayerRef.seekTo(seconds);
      toast.success(`Jumped to ${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await apiService.deleteProject(project.id);
        deleteProject(project.id);
        navigate('/projects');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white/60">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-prism rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="glass-shine rounded-lg p-2 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-white/60 mt-1">{project.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {project.video && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = project.video.url || project.video_data?.file_path;
                  a.download = project.video.name || project.video_data?.filename || 'video.mp4';
                  a.click();
                }}
                className="glass-shine px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-white"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            <button
              onClick={handleDelete}
              className="glass-shine px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
        
        {/* Project Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-shine rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Created</span>
            </div>
            <p className="text-white">{new Date(project.created_at).toLocaleDateString()}</p>
          </div>
          
          <div className="glass-shine rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Film className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Clips</span>
            </div>
            <p className="text-white">{project.video_data?.analysis?.results?.clips?.length || 0}</p>
          </div>
          
          <div className="glass-shine rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Video className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Video</span>
            </div>
            <p className="text-white">{project.video || project.video_data ? 'Uploaded' : 'No video'}</p>
          </div>
          
          <div className="glass-shine rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Status</span>
            </div>
            <p className="text-white capitalize">{project.status || 'created'}</p>
          </div>
        </div>
      </div>

      {/* Video Player Section */}
      <div className="glass-prism rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Video Player</h2>
        
        {!project.video && !project.video_data ? (
          <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center">
            <Video className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60 mb-4">No video uploaded yet</p>
            <label className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-6 py-3 rounded-lg text-white cursor-pointer inline-flex items-center gap-2 transition-colors">
              <Upload className="w-5 h-5" />
              Upload Video
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Player */}
            <VideoPlayer 
              ref={(ref) => setVideoPlayerRef(ref)}
              videoUrl={project.video?.url || project.video_data?.file_path} 
              projectId={project.id}
              onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
              onDuration={setDuration}
            />
            
            {/* Video Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-shine rounded-lg p-3">
                <p className="text-sm text-white/60 mb-1">File Name</p>
                <p className="text-white text-sm truncate">{project.video?.name || project.video_data?.filename || "Video"}</p>
              </div>
              <div className="glass-shine rounded-lg p-3">
                <p className="text-sm text-white/60 mb-1">Duration</p>
                <p className="text-white text-sm">{formatTime(project.video_data?.duration || duration)}</p>
              </div>
              <div className="glass-shine rounded-lg p-3">
                <p className="text-sm text-white/60 mb-1">Format</p>
                <p className="text-white text-sm">{project.video?.type?.split('/')[1] || 'mp4'}</p>
              </div>
              <div className="glass-shine rounded-lg p-3">
                <p className="text-sm text-white/60 mb-1">Size</p>
                <p className="text-white text-sm">
                  {(project.video?.size || project.video_data?.size || project.file_size) ? 
                    `${((project.video?.size || project.video_data?.size || project.file_size) / 1024 / 1024).toFixed(2)} MB` 
                    : 'Unknown'}
                </p>
              </div>
            </div>
            
            {/* Analyze Video Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowAnalysisModal(true)}
                disabled={project.status === 'analyzing'}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white cursor-pointer inline-flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                {project.status === 'analyzing' ? 'Analyzing...' : 'Analyze Video with AI'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Analysis Results Panel */}
      <AnalysisResultsPanel 
        project={project} 
        onSeekTo={handleSeekTo}
      />

      {project.error && (
        <div className="glass-prism rounded-2xl p-6 bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-medium mb-1">Analysis Error</h3>
              <p className="text-red-400 text-sm">{project.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        onStartAnalysis={handleStartAnalysis}
        defaultPrompt={project.analysis_prompt || "Analyze this video and identify key moments, highlights, and segments that would make compelling clips. Focus on engaging content, important topics, and natural break points."}
      />
    </div>
  );
};

export default ProjectDetail; 