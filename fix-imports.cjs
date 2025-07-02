#!/usr/bin/env node

/**
 * AUTONOMOUS IMPORT FIXER
 * Automatically fixes missing icon imports across the entire codebase
 */

const fs = require('fs');
const path = require('path');

// Common icon mapping for undefined references
const ICON_MAPPING = {
  'TrendingUpIcon': 'TrendingUpIcon',
  'SparklesIcon': 'SparklesIcon', 
  'BrainIcon': 'BrainIcon',
  'XIcon': 'XIcon',
  'VideoIcon': 'VideoIcon',
  'SettingsIcon': 'SettingsIcon',
  'LoaderIcon': 'LoaderIcon',
  'ZapIcon': 'ZapIcon',
  'ActivityIcon': 'ActivityIcon',
  'TerminalIcon': 'TerminalIcon',
  'CodeIcon': 'CodeIcon',
  'CheckCircleIcon': 'CheckCircleIcon',
  'PlayIcon': 'PlayIcon',
  'EyeIcon': 'EyeIcon',
  'AlertTriangleIcon': 'AlertTriangleIcon',
  'XCircle': 'XCircleIcon',
  'RotateCcw': 'RefreshCwIcon',
  'ClockIcon': 'ClockIcon',
  'CheckIcon': 'CheckIcon',
  'RefreshCwIcon': 'RefreshCwIcon',
  'AlertCircleIcon': 'AlertCircleIcon',
  'LinkIcon': 'LinkIcon',
  'TrashIcon': 'TrashIcon',
  'PlusIcon': 'PlusIcon',
  'SearchIcon': 'SearchIcon',
  'Grid3X3': 'Grid3X3Icon',
  'ListIcon': 'ListIcon',
  'ArrowRightIcon': 'ArrowRightIcon',
  'ChevronRightIcon': 'ChevronRightIcon',
  'UploadIcon': 'UploadIcon',
  'DownloadIcon': 'DownloadIcon',
  'ShareIcon': 'ShareIcon',
  'FileTextIcon': 'FileTextIcon',
  'MoreVerticalIcon': 'MoreVerticalIcon',
  'EditIcon': 'EditIcon',
  'UserIcon': 'UserIcon',
  'BellIcon': 'BellIcon',
  'HelpCircle': 'HelpCircleIcon',
  'MenuIcon': 'MenuIcon',
  'FolderIcon': 'FolderIcon',
  'Film': 'FilmIcon',
  'Target': 'TargetIcon',
  'PaletteIcon': 'PaletteIcon',
  'VolumeXIcon': 'VolumeXIcon',
  'Volume2Icon': 'Volume2Icon',
  'SkipBackIcon': 'SkipBackIcon',
  'SkipForwardIcon': 'SkipForwardIcon',
  'PauseIcon': 'PauseIcon',
  'MaximizeIcon': 'MaximizeIcon',
  'ScissorsIcon': 'ScissorsIcon',
  'Layers': 'LayersIcon',
  'TrendingDown': 'TrendingDownIcon',
  'StarIcon': 'StarIcon',
  'Mail': 'MailIcon',
  'Send': 'SendIcon',
  'Upload': 'UploadIcon',
  'Zap': 'ZapIcon',
  'CheckCircle': 'CheckCircleIcon',
  'ChevronRight': 'ChevronRightIcon',
  'FolderOpen': 'FolderIcon',
  'Plus': 'PlusIcon',
  'Settings': 'SettingsIcon',
  'BarChart2': 'BarChart2Icon',
  'BarChart3': 'BarChart2Icon',
  'TrendingUp': 'TrendingUpIcon',
  'Clock': 'ClockIcon',
  'Users': 'UsersIcon',
  'MessageSquare': 'MessageSquareIcon',
  'Home': 'HomeIcon',
  'Folder': 'FolderIcon',
  'Sparkles': 'SparklesIcon',
  'Download': 'DownloadIcon',
  'FileText': 'FileTextIcon',
  'Edit3': 'EditIcon',
  'Share2': 'ShareIcon',
  'Video': 'VideoIcon',
  'YoutubeIcon': 'YoutubeIcon',
  'PlayIconIcon': 'PlayIcon',
  'DownloadIconIcon': 'DownloadIcon',
  'Key': 'KeyIcon',
  'Shield': 'ShieldIcon',
  'Eye': 'EyeIcon',
  'Brain': 'BrainIcon',
  'ChevronLeft': 'ArrowLeftIcon',
  'ChevronLeftIcon': 'ArrowLeftIcon'
};

const IMPORT_STATEMENT = `import { 
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
} from '../Common/icons';`;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has icon imports
    if (content.includes("from '../Common/icons'") || content.includes('from "./icons"')) {
      return false;
    }
    
    // Check if file uses any icons
    const usesIcons = Object.keys(ICON_MAPPING).some(icon => 
      content.includes(icon) && !content.includes(`import ${icon}`)
    );
    
    if (!usesIcons) {
      return false;
    }
    
    // Find import section
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') && !lines[i].includes('from \'react\'')) {
        lastImportIndex = i;
      } else if (lines[i].trim() === '' && lastImportIndex >= 0) {
        break;
      }
    }
    
    if (lastImportIndex >= 0) {
      // Insert icon import after last import
      lines.splice(lastImportIndex + 1, 0, IMPORT_STATEMENT);
      
      const newContent = lines.join('\n');
      fs.writeFileSync(filePath, newContent);
      
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
  
  return false;
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  let fixCount = 0;
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && !item.startsWith('.')) {
      fixCount += processDirectory(fullPath);
    } else if (item.endsWith('.jsx') || item.endsWith('.tsx')) {
      if (processFile(fullPath)) {
        fixCount++;
      }
    }
  }
  
  return fixCount;
}

// Start fixing
console.log('🚀 AUTONOMOUS IMPORT FIXER - STARTING');
console.log('Scanning for missing icon imports...\n');

const srcDir = path.join(__dirname, 'src');
const fixedCount = processDirectory(srcDir);

console.log(`\n✨ COMPLETE: Fixed ${fixedCount} files`);
console.log('🎯 All icon imports should now be resolved!');
