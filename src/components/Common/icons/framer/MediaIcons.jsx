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

// Video Controls Icons with contextual animations
export const PauseIcon = (props) => (
  <AnimatedIcon {...props}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </AnimatedIcon>
);

export const SkipForwardIcon = (props) => (
  <AnimatedIcon {...props}>
    <polygon points="13 19 22 12 13 5 13 19" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </AnimatedIcon>
);

export const SkipBackIcon = (props) => (
  <AnimatedIcon {...props}>
    <polygon points="11 19 2 12 11 5 11 19" />
    <line x1="19" y1="19" x2="19" y2="5" />
  </AnimatedIcon>
);

export const Volume2Icon = (props) => (
  <AnimatedIcon {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <motion.path 
      d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  </AnimatedIcon>
);

export const ScissorsIcon = (props) => (
  <AnimatedIcon {...props}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </AnimatedIcon>
);

export const LayersIcon = (props) => (
  <AnimatedIcon {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </AnimatedIcon>
);
