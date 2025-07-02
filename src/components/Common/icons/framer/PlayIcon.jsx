import React from 'react';
import { motion } from 'framer-motion';
import { Icon, AnimatedIcon } from '../FramerBaseIcon';
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

// Play/Pause Icon with smooth morphing
export const PlayIcon = ({ isPlaying = false, ...props }) => (
  <AnimatedIcon {...props}>
    <motion.path
      d={isPlaying ? "M10 9v6M14 9v6" : "M5 3l14 9-14 9V3z"}
      animate={{ 
        d: isPlaying ? "M10 9v6M14 9v6" : "M5 3l14 9-14 9V3z"
      }}
      transition={{ duration: 0.2 }}
    />
  </AnimatedIcon>
);

// Menu/Hamburger Icon with transform animation
export const MenuIcon = ({ isOpen = false, ...props }) => (
  <AnimatedIcon {...props}>
    <motion.line x1="3" y1="12" x2="21" y2="12" 
      animate={{ 
        rotate: isOpen ? 45 : 0,
        y1: isOpen ? 12 : 12,
        y2: isOpen ? 12 : 12
      }}
    />
    <motion.line x1="3" y1="6" x2="21" y2="6"
      animate={{ 
        opacity: isOpen ? 0 : 1,
        scale: isOpen ? 0 : 1
      }}
    />
    <motion.line x1="3" y1="18" x2="21" y2="18"
      animate={{ 
        rotate: isOpen ? -45 : 0,
        y1: isOpen ? 12 : 18,
        y2: isOpen ? 12 : 18
      }}
    />
  </AnimatedIcon>
);
