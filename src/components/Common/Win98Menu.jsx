import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp as TrendingUpIcon,
  Sparkles as SparklesIcon,
  Brain as BrainIcon,
  X as XIcon,
  Video as VideoIcon,
  Settings as SettingsIcon,
  Loader as LoaderIcon,
  Zap as ZapIcon,
  Activity as ActivityIcon,
  CheckCircle as CheckCircleIcon,
  Play as PlayIcon,
  Eye as EyeIcon,
  AlertTriangle as AlertTriangleIcon,
  XCircle as XCircleIcon,
  RefreshCw as RefreshCwIcon,
  Clock as ClockIcon,
  Check as CheckIcon,
  AlertCircle as AlertCircleIcon,
  Link as LinkIcon,
  Trash as TrashIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Grid3X3 as Grid3X3Icon,
  List as ListIcon,
  ArrowRight as ArrowRightIcon,
  ChevronRight as ChevronRightIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  FileText as FileTextIcon,
  MoreVertical as MoreVerticalIcon,
  Edit as EditIcon,
  User as UserIcon,
  Bell as BellIcon,
  HelpCircle as HelpCircleIcon,
  Menu as MenuIcon,
  Folder as FolderIcon,
  Film as FilmIcon,
  Target as TargetIcon,
  Palette as PaletteIcon,
  VolumeX as VolumeXIcon,
  Volume2 as Volume2Icon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Pause as PauseIcon,
  Maximize as MaximizeIcon,
  Scissors as ScissorsIcon,
  Layers as LayersIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Mail as MailIcon,
  Send as SendIcon,
  Users as UsersIcon,
  MessageSquare as MessageSquareIcon,
  Home as HomeIcon,
  Youtube as YoutubeIcon,
  BarChart2 as BarChart2Icon,
  Key as KeyIcon,
  Shield as ShieldIcon,
  ArrowLeft as ArrowLeftIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon,
  Copy as CopyIcon,
  Loader2 as Loader2Icon,
  RotateCcw,
  ChevronDown as ChevronDownIcon,
  Brain,
  Eye,
  Zap,
  CheckCircle,
  XCircle,
  Mail,
  Send,
  Upload,
  PlayCircle as PlayCircleIcon
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon as Home,
  FolderIcon as Folder,
  SettingsIcon as Settings,
  TrendingUpIcon as TrendingUp,
  PlayIcon as Play,
  ScissorsIcon as Scissors,
  DownloadIcon as Download,
  ZapIcon as Zap,
  ChevronRightIcon as ChevronRight,
  PlusIcon
} from "./icons";
import useProjectStore from '../../stores/projectStore';
import ReactDOM from 'react-dom';

const Win98Menu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { getRecentProjects } = useProjectStore();

  const recentProjects = getRecentProjects ? getRecentProjects(5) : [];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const mainMenuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
    },
    {
      label: 'Projects',
      icon: Folder,
      path: '/projects',
      submenu: [
        { label: 'All Projects', path: '/projects', icon: Folder },
        { label: 'New Project', path: '/projects?create=true', icon: PlusIcon },
        ...(recentProjects.length > 0
          ? [
              { separator: true },
              { label: 'Recent Projects', isHeader: true },
              ...recentProjects.map((project) => ({
                label: project.name,
                path: `/projects/${project.id}`,
                icon: Play,
              })),
            ]
          : []),
      ],
    },
    {
      label: 'Clips',
      icon: Play,
      path: '/clips',
    },
    {
      label: 'Tools',
      icon: Zap,
      submenu: [
        { label: 'Quick Analyze', icon: Play, action: 'analyze' },
        { label: 'Trim Clips', icon: Scissors, action: 'trim' },
        { label: 'Export', icon: Download, action: 'export' },
      ],
    },
    { separator: true },
    {
      label: 'Analytics',
      icon: TrendingUp,
      path: '/analytics',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
    },
  ];

  const handleMenuClick = (item) => {
    if (item.submenu) {
      setActiveSubmenu(activeSubmenu === item.label ? null : item.label);
    } else if (item.path) {
      navigate(item.path);
      setIsOpen(false);
      setActiveSubmenu(null);
    } else if (item.action) {
      // Handle tool actions
      handleToolAction(item.action);
    }
  };

  const handleToolAction = (action) => {
    // Simplified tool actions for demo
    switch (action) {
      case 'analyze':
        navigate('/projects?filter=unanalyzed');
        break;
      case 'trim':
        navigate('/clips?mode=trim');
        break;
      case 'export':
        navigate('/projects?filter=completed');
        break;
    }
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  const renderMenuItem = (item, index) => {
    if (item.separator) {
      return <div key={`separator-${index}`} className="win98-menu-separator" />;
    }

    if (item.isHeader) {
      return (
        <div key={item.label} className="win98-menu-header">
          {item.label}
        </div>
      );
    }

    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    return (
      <div key={item.label} className="relative">
        <button
          className={`win98-menu-item ${isActive ? 'active' : ''}`}
          onClick={() => handleMenuClick(item)}
          onMouseEnter={() => hasSubmenu && setActiveSubmenu(item.label)}
        >
          {Icon && <Icon size={16} className="w-4 h-4" />}
          <span>{item.label}</span>
          {hasSubmenu && <ChevronRightIcon size={12} className="w-3 h-3 ml-auto" />}
        </button>

        {/* Submenu */}
        {hasSubmenu && activeSubmenu === item.label &&
          ReactDOM.createPortal(
            <div className="win98-submenu">
              {item.submenu.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
            </div>,
            document.body
          )}
      </div>
    );
  };

  return (
    <div className="win98-menu-container" ref={menuRef}>
      <button className="win98-menu-button win98-logo-button" onClick={() => setIsOpen(!isOpen)}>
        <div className="win98-logo-icon">
          <span className="win98-logo-text">OC</span>
        </div>
        <span className="win98-logo-name">OpenClip</span>
      </button>

      {isOpen &&
        ReactDOM.createPortal(
          <div className="win98-menu-dropdown">
            {mainMenuItems.map((item, index) => renderMenuItem(item, index))}
          </div>,
          document.body
        )}
    </div>
  );
};

export default Win98Menu;
