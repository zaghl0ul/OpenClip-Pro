import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getCurrentTheme } from '../../config/themes';
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

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const currentTheme = getCurrentTheme();
  const isRetroTheme = currentTheme === 'retro';

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    // Close sidebar on mobile when route changes
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        // Always show sidebar on desktop
        setSidebarOpen(true);
      }
    };

    // Set initial state based on screen size
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Add keyboard shortcut for sidebar toggle (Ctrl+B or Cmd+B)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [location]);

  // Create a subtle background pattern
  const bgPattern = {
    backgroundImage: `
      radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.01) 2px, transparent 0),
      radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.01) 2px, transparent 0)
    `,
    backgroundSize: '100px 100px',
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={bgPattern}>
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-background to-black/20 pointer-events-none z-0"></div>

      {/* Sidebar container (hidden in retro theme) */}
      {!isRetroTheme && (
        <div className="fixed top-16 left-0 bottom-0 z-[60]">
          <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
        </div>
      )}

      {/* Main content with fixed left margin */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 relative ${
          !isRetroTheme && isSidebarOpen ? 'lg:ml-64 ml-0' : !isRetroTheme ? 'ml-20' : 'ml-0'
        }`}
      >
        <Header onToggleSidebar={toggleSidebar} sidebarOpen={isSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
