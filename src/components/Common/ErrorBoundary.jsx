import React from 'react';
import { AlertTriangleIcon as AlertTriangle, RefreshCwIcon as RefreshCw, HomeIcon as Home, BugIcon as Bug } from './icons';
import { ScaleIn } from './LightweightMotion';
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to a logging service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // In production, you would send this to your error tracking service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    // For now, just log it
    console.error('Error Report:', errorReport);

    // TODO: Send to error tracking service
    // Example: Sentry, LogRocket, etc.
    // Sentry.captureException(error, { extra: errorReport })
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleToggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <ScaleIn className="max-w-2xl w-full">
            <div className="glass-card p-8 text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-error/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-error" />
              </div>

              {/* Error Message */}
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h1>
                <p className="text-gray-400 mb-6">
                  We encountered an unexpected error. Don&apos;t worry, our team has been notified.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <button
                  onClick={this.handleReload}
                  className="btn btn-primary flex items-center gap-2 justify-center"
                >
                  <RefreshCw size={16} className="w-4 h-4" /> Reload
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="btn btn-secondary flex items-center gap-2 justify-center"
                >
                  <Home size={16} className="w-4 h-4" /> Go Home
                </button>
                <button
                  onClick={this.handleToggleDetails}
                  className="btn btn-ghost flex items-center gap-2 justify-center"
                >
                  <Bug size={16} className="w-4 h-4" />
                  {this.state.showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {/* Error Details */}
              {this.state.showDetails && (
                <div className="bg-black/40 rounded p-4 text-left text-xs text-gray-300 max-h-60 overflow-auto">
                  <pre className="whitespace-pre-wrap break-all">
                    {this.state.error && this.state.error.toString()}
                    {'\n'}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-6">
                <p>
                  If this problem persists, please contact support with Error ID:{' '}
                  {this.state.errorId}
                </p>
              </div>

              <p className="text-sm text-gray-400 mt-2">
                Sorry, something went wrong. We&apos;re working to fix it!
              </p>
            </div>
          </ScaleIn>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
