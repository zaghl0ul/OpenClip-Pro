import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/Video/VideoPlayer';
import VideoUpload from '../components/Video/VideoUpload';
import ClipsList from '../components/Clips/ClipsList';
import ClipEditor from '../components/Clips/ClipEditor';
import AnalysisModal from '../components/Analysis/AnalysisModal';
import useProjectStore from '../stores/projectStore';
import toast from 'react-hot-toast';
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

const ProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, currentProject, loadProject, updateProject, createClips, exportClips } =
    useProjectStore();

  const [activeTab, setActiveTab] = useState('video');
  const [selectedClip, setSelectedClip] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showClipEditor, setShowClipEditor] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id, loadProject]);

  const project = currentProject || projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircleIcon size={48} className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
          <button onClick={() => navigate('/projects')} className="btn btn-primary mt-4">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const handleVideoUpload = async (file, metadata) => {
    try {
      // Update project with video info
      await updateProject(project.id, {
        video: {
          file: file,
          ...metadata,
        },
      });
      toast.success('Video uploaded successfully!');
      setActiveTab('analysis');
    } catch (error) {
      toast.error('Failed to upload video');
      console.error(error);
    }
  };

  const handleStartAnalysis = async (settings) => {
    try {
      setIsAnalyzing(true);
      setShowAnalysisModal(false);

      // Create clips with analysis settings
      await createClips(project.id, settings);

      toast.success('Analysis completed! Clips generated.');
      setActiveTab('clips');
    } catch (error) {
      toast.error('Analysis failed');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportAll = async () => {
    if (!project.clips || project.clips.length === 0) {
      toast.error('No clips to export');
      return;
    }

    try {
      setIsExporting(true);
      await exportClips(project.id, { all: true });
      toast.success('Export started! Check your downloads.');
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClip = async (clip) => {
    try {
      await exportClips(project.id, { clipId: clip.id });
      toast.success('Clip exported successfully!');
    } catch (error) {
      toast.error('Failed to export clip');
      console.error(error);
    }
  };

  const handleSaveClip = async (editedClip) => {
    try {
      await updateProject(project.id, {
        clips: project.clips.map((c) => (c.id === editedClip.id ? editedClip : c)),
      });
      toast.success('Clip saved successfully!');
      setShowClipEditor(false);
      setSelectedClip(null);
    } catch (error) {
      toast.error('Failed to save clip');
      console.error(error);
    }
  };

  const tabs = [
    { id: 'video', label: 'Video', icon: VideoIcon },
    { id: 'analysis', label: 'AI Analysis', icon: SparklesIcon },
    { id: 'clips', label: 'Clips', icon: VideoIcon },
  ];

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-subtle hover:text-white transition-colors mb-4"
        >
          <ChevronLeftIcon size={16} className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            {project.description && <p className="text-subtle">{project.description}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAll}
              disabled={!project.clips || project.clips.length === 0 || isExporting}
              className="btn btn-secondary flex items-center gap-2"
            >
              {isExporting ? (
                <LoaderIcon size={16} className="w-4 h-4 animate-spin" />
              ) : (
                <DownloadIcon size={16} className="w-4 h-4" />
              )}
              Export All
            </button>
            <button className="btn btn-ghost">
              <ShareIcon size={16} className="w-4 h-4" />
            </button>
            <button className="btn btn-ghost">
              <SettingsIcon size={16} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-8">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 flex items-center gap-2 transition-colors relative ${
                  activeTab === tab.id ? 'text-primary' : 'text-subtle hover:text-white'
                }`}
              >
                <Icon size={16} className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'video' && (
          <div className="space-y-6">
            {project.video ? (
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Project Video</h2>
                <VideoPlayer
                  src={project.video.url}
                  poster={project.video_data?.thumbnail_url || project.video.thumbnail}
                />
              </div>
            ) : (
              <VideoUpload onUpload={handleVideoUpload} projectId={project.id} />
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="glass-card p-6 text-center">
              <SparklesIcon size={48} className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">AI Video Analysis</h2>
              <p className="text-subtle mb-6">
                Use AI to automatically detect and create clips from your video
              </p>

              {isAnalyzing ? (
                <div className="py-8">
                  <LoaderIcon size={32} className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-subtle">Analyzing video...</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowAnalysisModal(true)}
                  disabled={!project.video}
                  className="btn btn-primary"
                >
                  Start AI Analysis
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clips' && (
          <div>
            {project.clips && project.clips.length > 0 ? (
              <ClipsList
                clips={project.clips}
                onSelect={(clip) => {
                  setSelectedClip(clip);
                  setShowClipEditor(true);
                }}
                onExport={handleExportClip}
                onDelete={(clipId) => {
                  updateProject(project.id, {
                    clips: project.clips.filter((c) => c.id !== clipId),
                  });
                  toast.success('Clip deleted');
                }}
              />
            ) : (
              <div className="glass-card p-8 text-center">
                <VideoIcon size={48} className="w-12 h-12 text-subtle mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No clips yet</h3>
                <p className="text-subtle mb-6">
                  Run AI analysis to generate clips from your video
                </p>
                <button onClick={() => setActiveTab('analysis')} className="btn btn-primary">
                  Go to Analysis
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAnalysisModal && (
        <AnalysisModal onStart={handleStartAnalysis} onClose={() => setShowAnalysisModal(false)} />
      )}

      {showClipEditor && selectedClip && (
        <ClipEditor
          clip={selectedClip}
          onSave={handleSaveClip}
          onCancel={() => {
            setShowClipEditor(false);
            setSelectedClip(null);
          }}
          onExport={handleExportClip}
        />
      )}
    </div>
  );
};

export default ProjectPage;
