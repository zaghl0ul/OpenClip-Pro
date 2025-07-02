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

// Eye Icon with visibility toggle
export const EyeIcon = ({ isVisible = true, ...props }) => (
  <AnimatedIcon {...props}>
    <motion.path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      animate={{ opacity: isVisible ? 1 : 0.3 }}
    />
    <motion.circle cx="12" cy="12" r="3"
      animate={{ scale: isVisible ? 1 : 0 }}
      transition={{ duration: 0.2 }}
    />
    {!isVisible && (
      <motion.line x1="1" y1="1" x2="23" y2="23"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3 }}
      />
    )}
  </AnimatedIcon>
);

// Additional Core Icons
export const PlusIcon = (props) => (
  <AnimatedIcon {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </AnimatedIcon>
);
