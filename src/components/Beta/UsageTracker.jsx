import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

const UsageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname,
      });
    }
  }, [location]);

  useEffect(() => {
    // Track user interactions
    const trackEvent = (eventName, eventData) => {
      if (window.gtag) {
        window.gtag('event', eventName, {
          event_category: 'user_interaction',
          event_label: eventData.element || 'unknown',
          custom_parameter_1: eventData.feature || 'unknown',
          custom_parameter_2: eventData.context || 'unknown'
        });
      }
    };

    // Track button clicks
    const handleClick = (e) => {
      const button = e.target.closest('button');
      if (button) {
        trackEvent('button_click', {
          element: button.textContent?.trim() || 'unnamed_button',
          feature: button.dataset.feature || 'unknown',
          context: location.pathname
        });
      }
    };

    // Track form submissions
    const handleSubmit = (e) => {
      const form = e.target.closest('form');
      if (form) {
        trackEvent('form_submit', {
          element: form.dataset.form || 'unknown_form',
          context: location.pathname
        });
      }
    };

    // Track video uploads
    const handleVideoUpload = () => {
      trackEvent('video_upload', {
        feature: 'video_upload',
        context: location.pathname
      });
    };

    // Track AI analysis requests
    const handleAnalysisStart = () => {
      trackEvent('ai_analysis_start', {
        feature: 'ai_analysis',
        context: location.pathname
      });
    };

    // Track errors
    const handleError = (error) => {
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          custom_parameter_1: location.pathname
        });
      }
    };

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    window.addEventListener('error', handleError);

    // Custom event listeners for app-specific actions
    window.addEventListener('video-uploaded', handleVideoUpload);
    window.addEventListener('analysis-started', handleAnalysisStart);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
      window.removeEventListener('error', handleError);
      window.addEventListener('video-uploaded', handleVideoUpload);
      window.addEventListener('analysis-started', handleAnalysisStart);
    };
  }, [location]);

  // Track user session data
  useEffect(() => {
    const sessionStart = Date.now();
    
    const trackSession = () => {
      const sessionDuration = Date.now() - sessionStart;
      if (window.gtag) {
        window.gtag('event', 'session_end', {
          event_category: 'engagement',
          custom_parameter_1: Math.round(sessionDuration / 1000), // seconds
          custom_parameter_2: location.pathname
        });
      }
    };

    window.addEventListener('beforeunload', trackSession);
    return () => window.removeEventListener('beforeunload', trackSession);
  }, [location]);

  // Helper function to manually track custom events
  window.trackUsage = (eventName, eventData = {}) => {
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'custom',
        event_label: eventData.label || 'unknown',
        ...eventData
      });
    }
  };

  return null; // This component doesn't render anything
};

export default UsageTracker; 