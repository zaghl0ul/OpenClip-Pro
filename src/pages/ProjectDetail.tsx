import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProjectStore from '../stores/projectStore';
import toast from 'react-hot-toast';
import VideoPlayer from '../components/Video/VideoPlayer';
import AnalysisModal from '../components/Analysis/AnalysisModal';
import AnalysisResultsPanel from '../components/Analysis/AnalysisResultsPanel';
import AnalysisStatusPanel from '../components/Analysis/AnalysisStatusPanel';
import useAnalysisStatus from '../hooks/useAnalysisStatus';
import apiService from '../services/api';

  LoaderIcon, 
  TrashIcon, 
  VideoIcon, 
  CheckCircleIcon, 
  BrainIcon, 
  SparklesIcon, 
  AlertOctagonIcon, 
  UploadIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  FileVideoIcon,
  HelpCircleIcon,
  RefreshCwIcon,
  LinkIcon
} from '../components/Common/icons';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProjectById, updateProject, deleteProject } = useProjectStore();
  const [project, setProject] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const videoPlayerRef = useRef(null);
  const analysisStatus = useAnalysisStatus();

  // Get project state - memoized to prevent unnecessary recalculations
  const projectState = useMemo(() => getProjectState(project, analysisStatus.isAnalyzing), [project, analysisStatus.isAnalyzing]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await getProjectById(id);
        if (projectData) {
          setProject(projectData);
        } else {
          toast.error('Project not found');
          navigate('/projects');
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project');
        navigate('/projects');
      }
    };

    if (id) {
      loadProject();
    }
  }, [id, getProjectById, navigate]);

  const handleStartAnalysis = useCallback(
    async ({ prompt, provider } = {}) => {
      try {
        // Validate inputs
        if (!prompt?.trim()) {
          toast.error('Please provide an analysis prompt');
          return;
        }

        if (!project) {
          toast.error('Project not found');
          return;
        }

        if (!project.video && !project.video_data) {
          toast.error('Please upload a video first');
          return;
        }

        // Close the modal and start analysis
        setShowAnalysisModal(false);

        // Start analysis status tracking
        if (analysisStatus?.startAnalysis) {
          analysisStatus.startAnalysis(provider || 'openai', prompt);
        }

        // Call the API
        const response = await apiService.analyzeVideo(project.id, prompt, provider || 'openai');

        // Handle different response formats
        let updatedProject = null;
        let clips = [];

        if (response?.project) {
          // Backend returned updated project
          updatedProject = response.project;
          clips = response.project.clips || [];
        } else if (response?.analysis?.clips) {
          // Backend returned analysis data
          clips = response.analysis.clips;
          // Update project with analysis results
          updatedProject = {
            ...project,
            clips: clips,
            status: 'completed',
            analysis_data: response.analysis,
            updated_at: new Date().toISOString()
          };
        } else if (response?.clips) {
          // Direct clips response
          clips = response.clips;
          updatedProject = {
            ...project,
            clips: clips,
            status: 'completed',
            analysis_data: response,
            updated_at: new Date().toISOString()
          };
        } else {
          throw new Error('No analysis results received from the API');
        }

        // Update project state
        if (updatedProject) {
          await updateProject(project.id, updatedProject);
          setProject(updatedProject);
          
          if (analysisStatus?.completeAnalysis) {
            analysisStatus.completeAnalysis(true, `Analysis completed! Found ${clips.length} clips.`);
          }
          
          toast.success(`Analysis completed! Found ${clips.length} potential clips.`);
        }

      } catch (error) {
        console.error('Analysis error:', error);

        if (error.message.includes('API key')) {
          toast.error('Please configure your API key in Settings');
        } else if (error.message.includes('lmstudio')) {
          toast.error('LM Studio error: Make sure LM Studio is running with a model loaded');
        } else {
          toast.error(`Analysis failed: ${error.message}`);
        }
        
        if (analysisStatus?.completeAnalysis) {
          analysisStatus.completeAnalysis(false, error.message);
        }
      }
    },
    [project, updateProject, analysisStatus]
  );

  const handleSeekTo = useCallback((seconds) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(seconds);
    }
  }, []);

  const handleFileUpload = useCallback(async (updatedProject) => {
    // This gets called from VideoUploadModal when upload is complete
    if (updatedProject) {
      setProject(updatedProject);
      toast.success('Video uploaded successfully!');
    }
    setShowUploadModal(false);
  }, []);

  const handleYouTubeSubmit = useCallback(async (url) => {
    if (!project?.id) {
      toast.error('Project not found');
      return;
    }

    try {
      const { processYouTubeForProject } = useProjectStore.getState();
      const result = await processYouTubeForProject(project.id, url);
      
      if (result.success && result.project) {
        setProject(result.project);
        toast.success(result.message || 'YouTube video processed successfully!');
      } else if (result.project) {
        setProject(result.project);
        toast.success('YouTube video processed successfully!');
      } else {
        throw new Error('Failed to process YouTube URL');
      }
    } catch (error) {
      console.error('YouTube processing error:', error);
      toast.error(`Failed to process YouTube URL: ${error.message}`);
      throw error;
    } finally {
      setShowYouTubeModal(false);
    }
  }, [project?.id]);

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-prism rounded-2xl p-8 text-center">
          <LoaderIcon size={32} className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-white">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <ProjectHeader
        project={project}
        isAnalyzing={analysisStatus.isAnalyzing}
        onBack={() => navigate('/projects')}
        onDelete={() => {
          deleteProject(project.id);
          navigate('/projects');
        }}
      />

      {/* Main Content - State-driven */}
      <div className="container mx-auto px-6 py-8">
        {projectState === 'empty' && (
          <EmptyProjectState
            project={project}
            onUploadClick={() => setShowUploadModal(true)}
            onYouTubeClick={() => setShowYouTubeModal(true)}
          />
        )}

        {projectState === 'uploaded' && (
          <UploadedProjectState
            project={project}
            onAnalyzeClick={() => setShowAnalysisModal(true)}
            onSeekTo={handleSeekTo}
            videoPlayerRef={videoPlayerRef}
            playing={playing}
            setPlaying={setPlaying}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            duration={duration}
            setDuration={setDuration}
          />
        )}

        {projectState === 'analyzing' && (
          <AnalyzingProjectState
            project={project}
            analysisStatus={analysisStatus}
            onCancel={() => analysisStatus.cancelAnalysis()}
          />
        )}

        {projectState === 'completed' && (
          <CompletedProjectState
            project={project}
            onSeekTo={handleSeekTo}
            onReanalyze={() => setShowAnalysisModal(true)}
            videoPlayerRef={videoPlayerRef}
            playing={playing}
            setPlaying={setPlaying}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            duration={duration}
            setDuration={setDuration}
          />
        )}

        {projectState === 'error' && (
          <ErrorProjectState
            project={project}
            onRetry={() => setShowAnalysisModal(true)}
            onUploadNew={() => setShowUploadModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        onStartAnalysis={handleStartAnalysis}
        defaultPrompt={
          project.analysis_prompt ||
          'Analyze this video and identify key moments, highlights, and segments that would make compelling clips. Focus on engaging content, important topics, and natural break points.'
        }
      />

      <VideoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        projectId={project.id}
        onUploadComplete={handleFileUpload}
      />

      <YouTubeModal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        onSubmit={handleYouTubeSubmit}
      />
    </div>
  );
};

// Header Component
const ProjectHeader = ({ project, isAnalyzing, onBack, onDelete }) => (
  <div className="glass-prism border-b border-white/10">
    <div className="container mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="glass-shine rounded-lg p-2 hover:bg-white/10 transition-colors"
          >
            <ChevronLeftIcon size={20} className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.description && <p className="text-white/60 mt-1">{project.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ProjectStatusBadge project={project} isAnalyzing={isAnalyzing} />
          <button
            onClick={onDelete}
            className="glass-shine rounded-lg p-2 hover:bg-red-500/20 text-red-400 transition-colors"
          >
            <TrashIcon size={20} className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Helper function for project state (moved outside component to be reusable)
const getProjectState = (project, isAnalyzing = false) => {
  if (!project) return 'loading';
  
  // Check if project has actual video data (not just metadata)
  const hasActualVideoData = project.video_data && 
                             Object.keys(project.video_data).length > 0 &&
                             project.status !== 'created';
  
  // Empty state: no video data and either no YouTube URL or project status is still 'created'
  if (!hasActualVideoData && (!project.youtube_url || project.status === 'created')) {
    return 'empty';
  }
  
  // Analyzing state: currently being analyzed
  if (isAnalyzing) return 'analyzing';
  
  // Completed state: has clips from analysis
  if (project.clips && project.clips.length > 0) return 'completed';
  
  // Error state: explicitly marked as error
  if (project.status === 'error') return 'error';
  
  // Uploaded state: has video data but no analysis results
  if (hasActualVideoData) return 'uploaded';
  
  // Default to empty if we can't determine state (likely no video content yet)
  return 'empty';
};

// Status Badge Component
const ProjectStatusBadge = ({ project, isAnalyzing = false }) => {
  const state = getProjectState(project, isAnalyzing);
  const configs = {
    empty: { icon: FileVideoIcon, text: 'No Content', className: 'bg-gray-500/20 text-gray-400' },
    uploaded: { icon: VideoIcon, text: 'Ready to Analyze', className: 'bg-blue-500/20 text-blue-400' },
    analyzing: { icon: BrainIcon, text: 'Analyzing...', className: 'bg-yellow-500/20 text-yellow-400' },
    completed: {
      icon: CheckCircleIcon,
      text: 'Analysis Complete',
      className: 'bg-green-500/20 text-green-400',
    },
    error: { icon: AlertOctagonIcon, text: 'Error', className: 'bg-red-500/20 text-red-400' },
  };

  const config = configs[state] || configs.empty;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full glass-shine ${config.className}`}
    >
      <Icon size={16} className="w-4 h-4" />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
};

// Empty Project State
const EmptyProjectState = ({ project, onUploadClick, onYouTubeClick }) => (
  <div className="max-w-4xl mx-auto">
    <div className="text-center mb-8">
      <div className="w-24 h-24 mx-auto mb-6 glass-prism rounded-2xl flex items-center justify-center">
        <VideoIcon size={48} className="w-12 h-12 text-primary/50" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Get Started</h2>
      <p className="text-white/60 text-lg max-w-2xl mx-auto">
        Upload a video or provide a YouTube URL to begin AI-powered video analysis and clip
        generation.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
      <UploadOption
        icon={FileVideoIcon}
        title="Upload Video File"
        description="Upload MP4, MOV, or other video formats"
        onClick={onUploadClick}
        primary
      />
      <UploadOption
        icon={LinkIcon}
        title="YouTube URL"
        description="Analyze videos directly from YouTube"
        onClick={onYouTubeClick}
      />
    </div>

    <div className="mt-12 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 glass-shine rounded-full text-white/60 text-sm">
        <HelpCircleIcon size={16} className="w-4 h-4" />
        <span>Supported formats: MP4, MOV, AVI, WebM • Max size: 500MB</span>
      </div>
    </div>
  </div>
);

// Upload Option Component
const UploadOption = ({ icon: Icon, title, description, onClick, primary = false }) => (
  <button
    onClick={onClick}
    className={`glass-card p-8 text-left group transition-all duration-300 ${
      primary ? 'ring-2 ring-primary/50' : ''
    }`}
  >
    <div
      className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-colors ${
        primary
          ? 'bg-primary/20 text-primary'
          : 'bg-white/10 text-white/60 group-hover:bg-primary/20 group-hover:text-primary'
      }`}
    >
      <Icon size={24} className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-white/60 mb-4">{description}</p>
    <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
      <span className="font-medium">Get Started</span>
      <ArrowRightIcon size={16} className="w-4 h-4" />
    </div>
  </button>
);

// Uploaded Project State
const UploadedProjectState = ({
  project,
  onAnalyzeClick,
  onSeekTo,
  videoPlayerRef,
  playing,
  setPlaying,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
}) => (
  <div className="max-w-6xl mx-auto space-y-8">
    {/* Quick Action Bar */}
    <div className="flex items-center justify-between glass-prism rounded-2xl p-6">
      <div className="flex items-center gap-4">
        <div size={48} className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
          <CheckCircleIcon size={24} className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Video Ready for Analysis</h3>
          <p className="text-white/60">Your video has been uploaded successfully</p>
        </div>
      </div>
      <button
        onClick={onAnalyzeClick}
        className="bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-all"
      >
        <BrainIcon size={20} className="w-5 h-5" />
        <span>Start AI Analysis</span>
      </button>
    </div>

    {/* Video Player */}
    <div className="glass-prism rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-6">Video Preview</h3>
      <VideoPlayer
        ref={videoPlayerRef}
        projectId={project.id}
        showControls={true}
        onProgress={(state) => setCurrentTime(state.playedSeconds)}
        onDuration={setDuration}
      />
    </div>
  </div>
);

// Analyzing Project State
const AnalyzingProjectState = ({ project, analysisStatus, onCancel }) => (
  <div className="max-w-4xl mx-auto">
    <AnalysisStatusPanel
      isAnalyzing={analysisStatus.isAnalyzing}
      step={analysisStatus.step}
      progress={analysisStatus.progress}
      message={analysisStatus.message}
      currentProvider={analysisStatus.currentProvider}
      getElapsedTime={analysisStatus.getElapsedTime}
      getRemainingTime={analysisStatus.getRemainingTime}
      onCancel={onCancel}
    />
  </div>
);

// Completed Project State
const CompletedProjectState = ({
  project,
  onSeekTo,
  onReanalyze,
  videoPlayerRef,
  playing,
  setPlaying,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
}) => (
  <div className="max-w-6xl mx-auto space-y-8">
    {/* Results Summary */}
    <div className="glass-prism rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div size={48} className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <SparklesIcon size={24} className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Analysis Complete</h3>
            <p className="text-white/60">Found {project.clips?.length || 0} potential clips</p>
          </div>
        </div>
        <button
          onClick={onReanalyze}
          className="glass-shine rounded-lg px-4 py-2 hover:bg-white/10 text-white transition-colors flex items-center gap-2"
        >
          <RefreshCwIcon size={16} className="w-4 h-4" />
          <span>Re-analyze</span>
        </button>
      </div>
    </div>

    {/* Video Player */}
    <div className="glass-prism rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-6">Video Player</h3>
      <VideoPlayer
        ref={videoPlayerRef}
        projectId={project.id}
        showControls={true}
        onProgress={(state) => setCurrentTime(state.playedSeconds)}
        onDuration={setDuration}
      />
    </div>

    {/* Analysis Results */}
    <div className="glass-prism rounded-2xl p-6">
      <h3 className="text-xl font-semibold text-white mb-6">Generated Clips</h3>
      <AnalysisResultsPanel project={project} onSeekTo={onSeekTo} />
    </div>
  </div>
);

// Error Project State
const ErrorProjectState = ({ project, onRetry, onUploadNew }) => (
  <div className="max-w-2xl mx-auto text-center">
    <div size={64} className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-2xl flex items-center justify-center">
      <AlertOctagonIcon size={32} className="w-8 h-8 text-red-400" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
    <p className="text-white/60 mb-8">
      We encountered an error while processing your video. You can try again or upload a different
      video.
    </p>
    <div className="flex gap-4 justify-center">
      <button
        onClick={onRetry}
        className="bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-all"
      >
        <RefreshCwIcon size={20} className="w-5 h-5" />
        <span>Try Again</span>
      </button>
      <button
        onClick={onUploadNew}
        className="glass-shine rounded-xl px-6 py-3 hover:bg-white/10 text-white font-medium transition-colors"
      >
        Upload New Video
      </button>
    </div>
  </div>
);

// Video Upload Modal Component
const VideoUploadModal = ({ isOpen, onClose, projectId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 500MB');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const { uploadVideoToProject } = useProjectStore.getState();
      const result = await uploadVideoToProject(projectId, file, (uploadProgress) => {
        setProgress(uploadProgress);
      });

      if (result.project) {
        onUploadComplete(result.project);
        toast.success('Video uploaded successfully!');
      } else {
        throw new Error('Upload completed but no project data returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-prism rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div size={64} className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-2xl flex items-center justify-center">
            <UploadIcon size={32} className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Upload Video</h3>
          <p className="text-white/60">Select a video file to upload</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="text-center">
            <div className="w-full bg-white/10 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/60">Uploading... {progress}%</p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 px-6 py-3 rounded-xl text-white font-medium transition-all"
            >
              Choose Video File
            </button>
            <button
              onClick={onClose}
              className="w-full glass-shine rounded-xl px-6 py-3 hover:bg-white/10 text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// YouTube Modal Component
const YouTubeModal = ({ isOpen, onClose, onSubmit }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      await onSubmit(url.trim());
      setUrl('');
    } catch (error) {
      toast.error(`Failed to process YouTube URL: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-prism rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div size={64} className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
            <LinkIcon size={32} className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">YouTube URL</h3>
          <p className="text-white/60">Enter a YouTube video URL to analyze</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
            required
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl text-white font-medium transition-all"
            >
              {loading ? 'Processing...' : 'Add Video'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-shine rounded-xl px-6 py-3 hover:bg-white/10 text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectDetail;
