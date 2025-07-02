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

// CheckCircle Icon with check animation
export const CheckCircleIcon = ({ checked = false, ...props }) => (
  <AnimatedIcon {...props}>
    <motion.circle cx="12" cy="12" r="10"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    />
    <motion.path 
      d="M9 12l2 2 4-4"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: checked ? 1 : 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    />
  </AnimatedIcon>
);

// Heart Icon with scale animation
export const HeartIcon = ({ liked = false, ...props }) => (
  <AnimatedIcon {...props}>
    <motion.path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      animate={{
        scale: liked ? [1, 1.3, 1] : 1,
        fill: liked ? "#ef4444" : "none"
      }}
      transition={{ duration: 0.3 }}
    />
  </AnimatedIcon>
);
