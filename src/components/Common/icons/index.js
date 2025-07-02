/**
 * Modern Icon Library with Lucide React
 * Provides comprehensive icon exports with consistent naming and tree-shaking support
 * Replaces the fragmented Framer Motion icon system with performance-optimized components
 */

// Core icon system
export { Icon, DynamicIcon, IconTransition, createIconComponent } from './LucideIcon';

// Navigation & Layout Icons
import {
  Home,
  Folder,
  Settings,
  User,
  LogOut,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Grid3X3,
  List,
  Menu,
  MoreVertical,
  MoreHorizontal,
  Navigation,
  Compass,
  Map
} from 'lucide-react';

// Action Icons
import {
  Download,
  Upload,
  Share,
  Share2,
  Trash,
  Trash2,
  Edit,
  Edit3,
  Save,
  Copy,
  Cut,
  Link,
  ExternalLink,
  Plus,
  Minus,
  X,
  Check,
  Refresh,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Media & Video Icons
import {
  Play,
  Pause,
  Stop,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Volume1,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Film,
  FileVideo,
  Image,
  Scissors,
  Layers,
  Zap,
  Wand2 as Magic,
  Sparkles,
  Target
} from 'lucide-react';

// Status & Feedback Icons
import {
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
  MessageSquare,
  MessageCircle,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bug,
  Shield,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

// File & Data Icons
import {
  File,
  FileText,
  FolderOpen,
  Database,
  HardDrive,
  Cloud,
  CloudUpload,
  CloudDownload,
  Archive,
  Package
} from 'lucide-react';

// Communication Icons
import {
  Mail,
  Send,
  Bell,
  BellOff,
  Phone,
  PhoneCall,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX
} from 'lucide-react';

// Interface & Utility Icons
import {
  Search,
  Filter,
  SlidersHorizontal as Sliders,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Calendar,
  Clock,
  Timer,
  Loader,
  Loader2,
  Palette,
  Paintbrush,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

// Business & Analytics Icons
import {
  BarChart,
  BarChart2,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  CreditCard
} from 'lucide-react';

// Platform-specific Icons
import {
  Youtube,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';

// Brain & AI Icons
import {
  Brain,
  Lightbulb,
  Cpu as Processor,
  Bot,
  Workflow,
  GitBranch,
  Binary,
  Cog
} from 'lucide-react';

// Shapes Icons
import {
  Circle,
  Square,
  Triangle,
  Hexagon,
  Diamond,
  Bookmark,
  Tag,
  Hash
} from 'lucide-react';

// Export all icons with consistent naming
export {
  // Navigation & Layout
  Home as HomeIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  User as UserIcon,
  LogOut as LogOutIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  Grid3X3 as GridIcon,
  Grid3X3 as Grid3X3Icon,
  List as ListIcon,
  Menu as MenuIcon,
  MoreVertical as MoreVerticalIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Navigation as NavigationIcon,
  Compass as CompassIcon,
  Map as MapIcon,

  // Actions
  Download as DownloadIcon,
  Upload as UploadIcon,
  Share as ShareIcon,
  Share2 as Share2Icon,
  Trash as TrashIcon,
  Trash2 as Trash2Icon,
  Edit as EditIcon,
  Edit3 as Edit3Icon,
  Save as SaveIcon,
  Copy as CopyIcon,
  Cut as CutIcon,
  Link as LinkIcon,
  ExternalLink as ExternalLinkIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  X as XIcon,
  X as CloseIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  RefreshCw as RefreshCwIcon,
  RotateCcw as RotateCcwIcon,
  RotateCw as RotateCwIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Maximize2 as Maximize2Icon,
  Minimize2 as Minimize2Icon,

  // Media & Video
  Play as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipForward as SkipForwardIcon,
  SkipBack as SkipBackIcon,
  FastForward as FastForwardIcon,
  Rewind as RewindIcon,
  Volume2 as Volume2Icon,
  Volume2 as VolumeIcon,
  VolumeX as VolumeXIcon,
  Volume1 as Volume1Icon,
  Video as VideoIcon,
  VideoOff as VideoOffIcon,
  Camera as CameraIcon,
  CameraOff as CameraOffIcon,
  Film as FilmIcon,
  FileVideo as FileVideoIcon,
  Image as ImageIcon,
  Scissors as ScissorsIcon,
  Layers as LayersIcon,
  Zap as ZapIcon,
  Magic as MagicIcon,
  Sparkles as SparklesIcon,
  Target as TargetIcon,

  // Status & Feedback
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  AlertOctagon as AlertOctagonIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircle2 as CheckCircle2Icon,
  XCircle as XCircleIcon,
  Info as InfoIcon,
  HelpCircle as HelpCircleIcon,
  MessageSquare as MessageSquareIcon,
  MessageCircle as MessageCircleIcon,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Flag as FlagIcon,
  Bug as BugIcon,
  Shield as ShieldIcon,
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert as ShieldAlertIcon,

  // Files & Data
  File as FileIcon,
  FileText as FileTextIcon,
  FolderOpen as FolderOpenIcon,
  Database as DatabaseIcon,
  HardDrive as HardDriveIcon,
  Cloud as CloudIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Archive as ArchiveIcon,
  Package as PackageIcon,

  // Communication
  Mail as MailIcon,
  Send as SendIcon,
  Bell as BellIcon,
  BellOff as BellOffIcon,
  Phone as PhoneIcon,
  PhoneCall as PhoneCallIcon,
  Users as UsersIcon,
  UserPlus as UserPlusIcon,
  UserMinus as UserMinusIcon,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon,

  // Interface & Utility
  Search as SearchIcon,
  Filter as FilterIcon,
  Sliders as SlidersIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Key as KeyIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Timer as TimerIcon,
  Loader as LoaderIcon,
  Loader2 as Loader2Icon,
  Palette as PaletteIcon,
  Paintbrush as PaintbrushIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Monitor as MonitorIcon,

  // Business & Analytics
  BarChart as BarChartIcon,
  BarChart2 as BarChart2Icon,
  BarChart3 as BarChart3Icon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Activity as ActivityIcon,
  DollarSign as DollarSignIcon,
  CreditCard as CreditCardIcon,

  // Shapes & Graphics
  Circle as CircleIcon,
  Square as SquareIcon,
  Triangle as TriangleIcon,
  Hexagon as HexagonIcon,
  Diamond as DiamondIcon,
  Bookmark as BookmarkIcon,
  Tag as TagIcon,
  Hash as HashIcon,

  // Platform-specific
  Youtube as YoutubeIcon,
  Github as GithubIcon,
  Twitter as TwitterIcon,
  Linkedin as LinkedinIcon,

  // Brain & AI
  Brain as BrainIcon,
  Lightbulb as LightbulbIcon,
  Processor as ProcessorIcon,
  Bot as BotIcon,
  Workflow as WorkflowIcon,
  GitBranch as GitBranchIcon,
  Binary as BinaryIcon,
  Cog as CogIcon
};

// Icon mapping for dynamic usage
export const iconMap = {
  // Navigation
  home: Home,
  folder: Folder,
  settings: Settings,
  user: User,
  logout: LogOut,
  menu: Menu,
  grid: Grid3X3,
  list: List,
  
  // Actions
  download: Download,
  upload: Upload,
  share: Share,
  trash: Trash,
  edit: Edit,
  save: Save,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  refresh: RefreshCw,
  
  // Media
  play: Play,
  pause: Pause,
  video: Video,
  camera: Camera,
  film: Film,
  scissors: Scissors,
  
  // Status
  alert: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
  info: Info,
  help: HelpCircle,
  
  // Utility
  search: Search,
  eye: Eye,
  'eye-off': EyeOff,
  clock: Clock,
  calendar: Calendar,
  loader: Loader2,
  
  // Theme
  sun: Sun,
  moon: Moon,
  
  // Communication
  mail: Mail,
  bell: Bell,
  users: Users,
  
  // Platform
  youtube: Youtube,
  github: Github,
  
  // AI & Brain
  brain: Brain,
  lightbulb: Lightbulb,
  bot: Bot,
  zap: Zap,
  sparkles: Sparkles
} as const;

// Type for dynamic icon names
export type IconName = keyof typeof iconMap;

// Export default icon map for backward compatibility
export default iconMap;