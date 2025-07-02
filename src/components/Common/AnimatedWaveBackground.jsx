import React from 'react';
import WavePattern from './WavePattern';
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

const AnimatedWaveBackground = ({ 
  intensity = 'subtle', // 'subtle', 'medium', 'vivid'
  animate = true 
}) => {
  const intensitySettings = {
    subtle: {
      opacity: 0.08,
      layerCount: 1,
      speeds: ['slow']
    },
    medium: {
      opacity: 0.12,
      layerCount: 2,
      speeds: ['slow', 'gentle']
    },
    vivid: {
      opacity: 0.18,
      layerCount: 3,
      speeds: ['slow', 'gentle', 'default']
    }
  };

  const settings = intensitySettings[intensity] || intensitySettings.subtle;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Primary wave layer - bottom */}
      <WavePattern
        size="fullscreen"
        opacity={settings.opacity}
        animate={animate}
        variant={settings.speeds[0]}
        color="primary"
        className="-bottom-10 -left-10"
      />
      
      {/* Secondary wave layer - offset */}
      <WavePattern
        size="fullscreen"
        opacity={settings.opacity * 0.8}
        animate={animate}
        variant={settings.speeds[1]}
        color="accent"
        className="-bottom-5 -left-5 transform rotate-2"
      />
      
      {/* Tertiary wave layer - top accent */}
      <WavePattern
        size="fullscreen"
        opacity={settings.opacity * 0.6}
        animate={animate}
        variant={settings.speeds[2]}
        color="primary"
        className="-top-10 -right-10 transform rotate-180"
      />
      
      {settings.layerCount >= 4 && (
        <WavePattern
          size="fullscreen"
          opacity={settings.opacity * 0.4}
          animate={animate}
          variant={settings.speeds[3]}
          color="accent"
          className="-top-5 -left-5 transform -rotate-1"
        />
      )}
      
      {settings.layerCount >= 5 && (
        <WavePattern
          size="fullscreen"
          opacity={settings.opacity * 0.5}
          animate={animate}
          variant={settings.speeds[4]}
          color="primary"
          className="-bottom-20 -right-10 transform rotate-1"
        />
      )}
      
      {settings.layerCount >= 6 && (
        <WavePattern
          size="fullscreen"
          opacity={settings.opacity * 0.4}
          animate={animate}
          variant={settings.speeds[5]}
          color="accent"
          className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45"
        />
      )}
      
      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at top left, var(--color-gradientStart) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, var(--color-gradientEnd) 0%, transparent 50%),
            radial-gradient(ellipse at center, var(--color-primary) 0%, transparent 70%)
          `,
          opacity: settings.opacity * 0.8
        }}
      />
    </div>
  );
};

export default AnimatedWaveBackground; 