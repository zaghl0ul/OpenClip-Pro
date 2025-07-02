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

// ChevronRight with subtle animation
export const ChevronRightIcon = (props) => (
  <AnimatedIcon {...props}>
    <polyline points="9 18 15 12 9 6" />
  </AnimatedIcon>
);

// Download Icon with downward motion
export const DownloadIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <motion.polyline 
      points="7 10 12 15 17 10"
      initial={{ y: -5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
    <line x1="12" y1="15" x2="12" y2="3" />
  </AnimatedIcon>
);

// Upload Icon with upward motion
export const UploadIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <motion.polyline 
      points="17 8 12 3 7 8"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
    <line x1="12" y1="3" x2="12" y2="15" />
  </AnimatedIcon>
);

// Share Icon with expanding animation
export const ShareIcon = (props) => (
  <AnimatedIcon {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <motion.line x1="8.59" y1="13.51" x2="15.42" y2="17.49"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3 }}
    />
    <motion.line x1="15.41" y1="6.51" x2="8.59" y2="10.49"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    />
  </AnimatedIcon>
);

// Trash Icon with lid animation
export const TrashIcon = (props) => (
  <AnimatedIcon {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </AnimatedIcon>
);
