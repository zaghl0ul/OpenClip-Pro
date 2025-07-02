import React from 'react';

import {
  TrendingUp as TrendingUpIcon,
  Sparkles as SparklesIcon,
  Brain as BrainIcon,
  X as XIcon,
  Video as VideoIcon,
  Settings as SettingsIcon,
  Loader as LoaderIcon,
  Zap as ZapIcon,
  Activity as ActivityIcon,
  CheckCircle as CheckCircleIcon,
  Play as PlayIcon,
  Eye as EyeIcon,
  AlertTriangle as AlertTriangleIcon,
  XCircle as XCircleIcon,
  RefreshCw as RefreshCwIcon,
  Clock as ClockIcon,
  Check as CheckIcon,
  AlertCircle as AlertCircleIcon,
  Link as LinkIcon,
  Trash as TrashIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Grid3X3 as Grid3X3Icon,
  List as ListIcon,
  ArrowRight as ArrowRightIcon,
  ChevronRight as ChevronRightIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  FileText as FileTextIcon,
  MoreVertical as MoreVerticalIcon,
  Edit as EditIcon,
  User as UserIcon,
  Bell as BellIcon,
  HelpCircle as HelpCircleIcon,
  Menu as MenuIcon,
  Folder as FolderIcon,
  Film as FilmIcon,
  Target as TargetIcon,
  Palette as PaletteIcon,
  VolumeX as VolumeXIcon,
  Volume2 as Volume2Icon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Pause as PauseIcon,
  Maximize as MaximizeIcon,
  Scissors as ScissorsIcon,
  Layers as LayersIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Mail as MailIcon,
  Send as SendIcon,
  Users as UsersIcon,
  MessageSquare as MessageSquareIcon,
  Home as HomeIcon,
  Youtube as YoutubeIcon,
  BarChart2 as BarChart2Icon,
  Key as KeyIcon,
  Shield as ShieldIcon,
  ArrowLeft as ArrowLeftIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon,
  Copy as CopyIcon,
  Loader2 as Loader2Icon,
  RotateCcw,
  ChevronDown as ChevronDownIcon,
  Brain,
  Eye,
  Zap,
  CheckCircle,
  XCircle,
  Mail,
  Send,
  Upload,
  PlayCircle as PlayCircleIcon
} from 'lucide-react';
const AnalysisStatusPanel = ({
  isAnalyzing,
  step,
  progress,
  message,
  currentProvider,
  getElapsedTime,
  getRemainingTime,
  onCancel,
  onRetry,
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    if (step === 'completed') return <CheckCircleIcon size={24} className="w-6 h-6 text-green-400" />;
    if (step === 'error') return <XCircle size={24} className="w-6 h-6 text-red-400" />;
    if (isAnalyzing) return <LoaderIcon size={24} className="w-6 h-6 text-blue-400 animate-spin" />;
    return <BrainIcon size={24} className="w-6 h-6 text-purple-400" />;
  };

  const getStatusColor = () => {
    if (step === 'completed') return 'border-green-500/30 bg-green-500/10';
    if (step === 'error') return 'border-red-500/30 bg-red-500/10';
    if (isAnalyzing) return 'border-blue-500/30 bg-blue-500/10';
    return 'border-white/20 bg-white/5';
  };

  const getStepDetails = (currentStep) => {
    const steps = {
      initializing: { icon: Brain, color: 'text-purple-400', label: 'Initializing' },
      extracting: { icon: Eye, color: 'text-cyan-400', label: 'Extracting Frames' },
      preprocessing: { icon: Zap, color: 'text-yellow-400', label: 'Preprocessing' },
      analyzing: { icon: Brain, color: 'text-blue-400', label: 'AI Analysis' },
      processing: { icon: Zap, color: 'text-green-400', label: 'Processing Results' },
      completed: { icon: CheckCircle, color: 'text-green-400', label: 'Completed' },
      error: { icon: XCircle, color: 'text-red-400', label: 'Error' },
    };
    return steps[currentStep] || steps.initializing;
  };

  if (!isAnalyzing && step !== 'completed' && step !== 'error') {
    return null;
  }

  return (
    <div
      className={`glass-prism rounded-2xl p-6 border ${getStatusColor()} backdrop-blur-xl`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-white">
                {step === 'completed'
                  ? 'Analysis Complete'
                  : step === 'error'
                    ? 'Analysis Failed'
                    : 'AI Video Analysis'}
              </h3>
              <p className="text-white/60 text-sm">
                {currentProvider &&
                  `Using ${currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)}`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {step === 'error' && onRetry && (
              <button
                onClick={onRetry}
                className="glass-shine px-3 py-2 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-colors flex items-center gap-2"
              >
                <RotateCcw size={16} className="w-4 h-4" />
                Retry
              </button>
            )}
            {isAnalyzing && onCancel && (
              <button
                onClick={onCancel}
                className="glass-shine px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {(isAnalyzing || step === 'completed') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">{message}</span>
              <span className="text-white/60">{Math.round(progress)}%</span>
            </div>

            <div className="relative">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>
              </div>

              {/* Progress glow effect */}
              <div
                className="absolute top-0 left-0 h-3 bg-blue-400/30 rounded-full blur-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Indicators */}
        {isAnalyzing && (
          <div className="flex items-center justify-between">
            {['initializing', 'extracting', 'preprocessing', 'analyzing', 'processing'].map(
              (stepName, index) => {
                const stepInfo = getStepDetails(stepName);
                const Icon = stepInfo.icon;
                const isActive = step === stepName;
                const isCompleted =
                  [
                    'initializing',
                    'extracting',
                    'preprocessing',
                    'analyzing',
                    'processing',
                  ].indexOf(step) > index;

                return (
                  <div key={stepName} className="flex flex-col items-center gap-2">
                    <div
                      className={`relative p-2 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? `border-blue-500 bg-blue-500/20`
                          : isCompleted
                            ? `border-green-500 bg-green-500/20`
                            : `border-white/20 bg-white/5`
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-colors duration-300 ${
                          isActive
                            ? 'text-blue-400'
                            : isCompleted
                              ? 'text-green-400'
                              : 'text-white/40'
                        }`}
                      />

                      {/* Pulse animation for active step */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-75" />
                      )}
                    </div>

                    <span
                      className={`text-xs font-medium transition-colors duration-300 ${
                        isActive
                          ? 'text-blue-400'
                          : isCompleted
                            ? 'text-green-400'
                            : 'text-white/40'
                      }`}
                    >
                      {stepInfo.label}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* Time Information */}
        {isAnalyzing && (
          <div className="flex items-center justify-between text-sm text-white/60">
            <div className="flex items-center gap-2">
              <ClockIcon size={16} className="w-4 h-4" />
              <span>Elapsed: {formatTime(getElapsedTime())}</span>
            </div>
            {getRemainingTime() > 0 && (
              <span>Remaining: ~{formatTime(getRemainingTime())}</span>
            )}
          </div>
        )}

        {/* Error Details */}
        {step === 'error' && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangleIcon size={16} className="w-4 h-4" />
              <span className="font-medium">Analysis Error</span>
            </div>
            <p className="text-red-300 text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisStatusPanel;
