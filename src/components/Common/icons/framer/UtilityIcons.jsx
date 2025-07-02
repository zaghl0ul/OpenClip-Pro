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

// Search Icon with scale animation
export const SearchIcon = (props) => (
  <AnimatedIcon {...props}>
    <motion.circle cx="11" cy="11" r="8"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    />
    <motion.path d="m21 21-4.35-4.35"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    />
  </AnimatedIcon>
);

// Trending Up Icon with path animation
export const TrendingUpIcon = (props) => (
  <AnimatedIcon {...props}>
    <motion.polyline 
      points="23 6 13.5 15.5 8.5 10.5 1 18"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
    <motion.polyline 
      points="17 6 23 6 23 12"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    />
  </AnimatedIcon>
);

// Loader Icon with continuous rotation
export const LoaderIcon = (props) => (
  <AnimatedIcon {...props}>
    <motion.path
      d="M21 12a9 9 0 1 1-6.219-8.56"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  </AnimatedIcon>
);

// Sparkles Icon with pulsing animation
export const SparklesIcon = (props) => (
  <AnimatedIcon {...props}>
    <motion.path
      d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [1, 0.8, 1]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.path
      d="M5 3v4M19 17v4M3 5h4M17 19h4"
      animate={{ 
        opacity: [0, 1, 0],
        scale: [0.8, 1.2, 0.8]
      }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    />
  </AnimatedIcon>
);

// Minus Icon
export const MinusIcon = ({ size = 24, color = "currentColor", className = "", ...props }) => (
  <Icon size={size} color={color} className={className} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

// Save Icon
export const SaveIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </AnimatedIcon>
);

// Triangle Icon
export const TriangleIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </AnimatedIcon>
);

// Hexagon Icon
export const HexagonIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </AnimatedIcon>
);

// Circle Icon
export const CircleIcon = (props) => (
  <AnimatedIcon {...props}>
    <circle cx="12" cy="12" r="10" />
  </AnimatedIcon>
);

// Square Icon
export const SquareIcon = (props) => (
  <AnimatedIcon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </AnimatedIcon>
);

// Minimize Icon
export const MinimizeIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
  </AnimatedIcon>
);

// Maximize Icon
export const MaximizeIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </AnimatedIcon>
);

// Volume X Icon
export const VolumeXIcon = (props) => (
  <AnimatedIcon {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </AnimatedIcon>
);

// Alert Octagon Icon
export const AlertOctagonIcon = (props) => (
  <AnimatedIcon {...props}>
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </AnimatedIcon>
);
