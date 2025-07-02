import React from 'react';
import { AlertCircleIcon } from '../../Common/icons';
import { isValidYouTubeUrl } from '../../../utils/validators';
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

const YouTubeUrlStep = ({ youtubeUrl, setYoutubeUrl, error }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-2">YouTube URL</h3>
        <p className="text-gray-400">Enter the YouTube video URL you want to analyze</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">YouTube URL *</label>
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="input"
          autoFocus
        />
        {error && (
          <div className="flex items-center gap-2 mt-2 text-red-400">
            <AlertCircleIcon size={16} className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {youtubeUrl && !error && !isValidYouTubeUrl(youtubeUrl) && (
          <div className="flex items-center gap-2 mt-2 text-red-400">
            <AlertCircleIcon size={16} className="w-4 h-4" />
            <span className="text-sm">Please enter a valid YouTube URL</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeUrlStep;
