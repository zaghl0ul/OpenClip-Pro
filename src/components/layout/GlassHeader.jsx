import React from 'react';
import { SlideInDown, MotionButton } from '../Common/LightweightMotion';
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

const GlassHeader = ({ onMenuClick }) => {
  return (
    <SlideInDown className="glass-frosted fixed top-4 left-4 right-4 rounded-2xl p-4 z-40 gpu-accelerated">
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo & Navigation */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <MotionButton
              className="lg:hidden glass-frosted rounded-xl p-2 text-white hover:bg-white/10 transition-colors"
              onClick={onMenuClick}
              whileTap={{ scale: 0.95 }}
            >
              <MenuIcon size={20} className="w-5 h-5" />
            </MotionButton>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 glass-frosted rounded-xl flex items-center justify-center">
                <ZapIcon size={24} className="w-6 h-6 text-indigo-300" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">VideoForge</span>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="relative flex-1">
              <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, clips..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <MotionButton
              className="glass-frosted rounded-xl p-2 text-white hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <UploadIcon size={20} className="w-5 h-5" />
            </MotionButton>

            {/* Create Project Button */}
            <MotionButton
              className="glass-frosted rounded-xl p-2 text-white hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusIcon size={20} className="w-5 h-5" />
            </MotionButton>

            {/* Notifications */}
            <MotionButton
              className="glass-frosted rounded-xl p-2 text-white hover:bg-white/10 transition-colors relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BellIcon size={20} className="w-5 h-5" />
              <span size={12} className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </MotionButton>

            {/* Settings */}
            <MotionButton
              className="glass-frosted rounded-xl p-2 text-white hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SettingsIcon size={20} className="w-5 h-5" />
            </MotionButton>

            {/* Help */}
            <MotionButton
              className="glass-frosted rounded-xl p-2 text-white hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <HelpCircle size={20} className="w-5 h-5" />
            </MotionButton>

            {/* User Avatar */}
            <MotionButton
              className="glass-frosted rounded-xl p-2 text-white hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <UserIcon size={20} className="w-5 h-5" />
            </MotionButton>
          </div>
        </div>
      </div>
    </SlideInDown>
  );
};

export default GlassHeader;
