import React from 'react';
import { UploadIcon, LinkIcon, CheckIcon } from '../../Common/icons';
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

const ProjectTypeStep = ({ projectType, setProjectType }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Choose Project Type</h3>
        <p className="text-gray-400">How would you like to add your video?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setProjectType('upload');
          }}
          className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
            projectType === 'upload'
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-lg ${
                projectType === 'upload' ? 'bg-primary-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              <UploadIcon size={24} className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-medium text-gray-100">Upload Video</h4>
              <p className="text-sm text-gray-400">Upload from your device</p>
            </div>
          </div>
          {projectType === 'upload' && (
            <div className="mt-4 flex items-center gap-2 text-primary-400">
              <CheckIcon size={16} className="w-4 h-4" />
              <span className="text-sm">Selected</span>
            </div>
          )}
        </button>

        <button
          onClick={() => {
            setProjectType('youtube');
          }}
          className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
            projectType === 'youtube'
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-lg ${
                projectType === 'youtube'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              <LinkIcon size={24} className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-medium text-gray-100">YouTube Link</h4>
              <p className="text-sm text-gray-400">Import from YouTube URL</p>
            </div>
          </div>
          {projectType === 'youtube' && (
            <div className="mt-4 flex items-center gap-2 text-primary-400">
              <CheckIcon size={16} className="w-4 h-4" />
              <span className="text-sm">Selected</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProjectTypeStep;
