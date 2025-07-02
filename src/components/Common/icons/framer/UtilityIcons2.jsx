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

// Utility Icons with contextual animations
export const PaletteIcon = (props) => (
  <AnimatedIcon {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.19 0 2.34-.2 3.41-.6.3-.11.49-.4.49-.72 0-.43-.35-.78-.78-.78-.17 0-.33.06-.46.14-.72.37-1.52.58-2.66.58-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8c0 .34-.03.67-.09.98-.04.21.09.42.28.48.05.02.11.02.16.02.16 0 .31-.09.39-.23.13-.25.23-.51.31-.78.05-.17.08-.34.11-.52.05-.3.08-.61.08-.93 0-5.52-4.48-10-10-10z"/>
    <circle cx="6.5" cy="11.5" r="1.5"/>
    <circle cx="9.5" cy="7.5" r="1.5"/>
    <circle cx="14.5" cy="7.5" r="1.5"/>
    <circle cx="17.5" cy="11.5" r="1.5"/>
  </AnimatedIcon>
);

export const ZapIcon = (props) => (
  <AnimatedIcon {...props}>
    <motion.polygon 
      points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    />
  </AnimatedIcon>
);

export const RefreshCwIcon = (props) => (
  <AnimatedIcon {...props}>
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </motion.g>
  </AnimatedIcon>
);
