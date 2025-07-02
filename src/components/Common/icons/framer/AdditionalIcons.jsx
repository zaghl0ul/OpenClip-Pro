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

// Additional Essential Icons
export const BugIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M9 9V6a3 3 0 0 1 6 0v3M8 9h8M5 9a7 7 0 0 0 14 0M5 9l-1-3M19 9l1-3M12 22V9M8 13h.01M16 13h.01" />
  </AnimatedIcon>
);

export const MessageSquareIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </AnimatedIcon>
);

export const StarIcon = (props) => (
  <AnimatedIcon {...props}>
    <motion.polygon 
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  </AnimatedIcon>
);

export const LightbulbIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M9 18h6M10 22h4M15 2a7 7 0 0 1 0 10 1 1 0 0 0-1 1v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-3a1 1 0 0 0-1-1 7 7 0 0 1 0-10" />
  </AnimatedIcon>
);

export const MailIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </AnimatedIcon>
);

export const TargetIcon = (props) => (
  <AnimatedIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </AnimatedIcon>
);
