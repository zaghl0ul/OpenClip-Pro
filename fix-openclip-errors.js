#!/usr/bin/env node

/**
 * Comprehensive Error Fix Script for OpenClip Pro
 * This script systematically fixes all errors in the project
 */

const fs = require('fs').promises;
const path = require('path');

const PROJECT_ROOT = 'C:/Users/mikazukinoyaiba/Desktop/GOODUIIOPC';

// Master icon import statement that includes all lucide-react icons
const MASTER_ICON_IMPORT = `import {
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
} from 'lucide-react';`;

// Files that need icon imports fixed
const filesToFixIcons = [
  'src/components/Analysis/AnalysisResultsPanel.jsx',
  'src/components/Analysis/AnalysisStatusPanel.jsx',
  'src/components/Beta/BetaSignupModal.jsx',
  'src/components/Beta/OnboardingFlow.jsx',
  'src/components/Common/Win98Menu.jsx',
  'src/components/Video/VideoControls.jsx',
  'src/components/Common/ProcessingOverlay.jsx'
];

// Icon mapping fixes for specific components
const iconFixes = {
  'src/components/Video/VideoControls.jsx': {
    'PlayIconIcon': 'PlayIcon'
  },
  'src/components/Common/ProcessingOverlay.jsx': {
    duplicates: ['SparklesIcon']
  }
};

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error);
    return false;
  }
}

async function fixIconImports(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  const content = await readFile(fullPath);
  if (!content) return;

  let newContent = content;

  // Remove all existing lucide-react imports
  newContent = newContent.replace(/import\s*{[^}]*}\s*from\s*['"]lucide-react['"];?\s*\n?/g, '');

  // Find where to insert the new import (after React import)
  const reactImportMatch = newContent.match(/import\s+React.*?;\s*\n/);
  if (reactImportMatch) {
    const insertPosition = reactImportMatch.index + reactImportMatch[0].length;
    newContent = newContent.slice(0, insertPosition) + MASTER_ICON_IMPORT + '\n' + newContent.slice(insertPosition);
  } else {
    // If no React import found, add at the beginning
    newContent = MASTER_ICON_IMPORT + '\n\n' + newContent;
  }

  // Fix specific icon name issues
  if (iconFixes[filePath]) {
    for (const [oldName, newName] of Object.entries(iconFixes[filePath])) {
      if (typeof newName === 'string') {
        newContent = newContent.replace(new RegExp(oldName, 'g'), newName);
      }
    }
  }

  // Remove duplicate imports in the same file
  const lines = newContent.split('\n');
  const seenImports = new Set();
  const filteredLines = lines.filter(line => {
    if (line.includes('import') && line.includes('from')) {
      const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(i => i.trim());
        const isDuplicate = imports.some(imp => seenImports.has(imp));
        imports.forEach(imp => seenImports.add(imp));
        return !isDuplicate;
      }
    }
    return true;
  });
  newContent = filteredLines.join('\n');

  await writeFile(fullPath, newContent);
}

async function fixProcessingOverlay() {
  const filePath = path.join(PROJECT_ROOT, 'src/components/Common/ProcessingOverlay.jsx');
  const content = await readFile(filePath);
  if (!content) return;

  // Fix duplicate SparklesIcon import
  let newContent = content.replace(
    /import\s*{[^}]*SparklesIcon[^}]*SparklesIcon[^}]*}\s*from\s*['"]lucide-react['"];?/g,
    'import { SparklesIcon } from \'lucide-react\';'
  );

  await writeFile(filePath, newContent);
}

async function fixTypescriptErrors() {
  // Fix LucideIcon.tsx interface issue
  const lucideIconPath = path.join(PROJECT_ROOT, 'src/components/Common/icons/LucideIcon.tsx');
  const content = await readFile(lucideIconPath);
  if (content) {
    // Convert to module syntax
    let newContent = content.replace(
      /interface\s+LucideIconProps/g,
      'export interface LucideIconProps'
    );
    await writeFile(lucideIconPath, newContent);
  }

  // Fix VideoEditor.tsx interface issue
  const videoEditorPath = path.join(PROJECT_ROOT, 'src/components/VideoEditor/VideoEditor.tsx');
  const videoContent = await readFile(videoEditorPath);
  if (videoContent) {
    let newContent = videoContent.replace(
      /interface\s+VideoEditorProps/g,
      'export interface VideoEditorProps'
    );
    await writeFile(videoEditorPath, newContent);
  }
}

async function fixDuplicateIconExports() {
  const iconDir = path.join(PROJECT_ROOT, 'src/components/Common/icons/framer');
  const iconFiles = await fs.readdir(iconDir);

  for (const file of iconFiles) {
    if (file.endsWith('.jsx')) {
      const filePath = path.join(iconDir, file);
      const content = await readFile(filePath);
      if (!content) continue;

      // Extract the icon name from the file
      const iconNameMatch = content.match(/export\s+const\s+(\w+Icon)\s*=/);
      if (iconNameMatch) {
        const iconName = iconNameMatch[1];
        
        // Check if there are duplicate declarations
        const declarations = content.match(new RegExp(`(const|let|var|function|export)\\s+${iconName}`, 'g'));
        if (declarations && declarations.length > 1) {
          // Remove duplicate declarations, keeping only the export
          let newContent = content;
          
          // Remove non-export declarations
          newContent = newContent.replace(
            new RegExp(`(?<!export\\s+)(const|let|var|function)\\s+${iconName}\\s*=`, 'g'),
            `// Removed duplicate: $1 ${iconName} =`
          );
          
          await writeFile(filePath, newContent);
        }
      }
    }
  }
}

async function fixIconSystemDemo() {
  const filePath = path.join(PROJECT_ROOT, 'src/components/Common/IconSystemDemo.tsx');
  const content = await readFile(filePath);
  if (!content) return;

  // Fix unescaped quotes
  let newContent = content.replace(
    /"basic"/g,
    '&quot;basic&quot;'
  ).replace(
    /"theme"/g,
    '&quot;theme&quot;'
  );

  await writeFile(filePath, newContent);
}

async function createMissingIconImports() {
  // Create a centralized icon export file
  const centralIconsPath = path.join(PROJECT_ROOT, 'src/components/Common/icons/lucide-exports.js');
  
  const centralIconContent = `// Centralized Lucide React icon exports
${MASTER_ICON_IMPORT}

// Re-export all icons
export {
  TrendingUpIcon,
  SparklesIcon,
  BrainIcon,
  XIcon,
  VideoIcon,
  SettingsIcon,
  LoaderIcon,
  ZapIcon,
  ActivityIcon,
  CheckCircleIcon,
  PlayIcon,
  EyeIcon,
  AlertTriangleIcon,
  XCircleIcon,
  RefreshCwIcon,
  ClockIcon,
  CheckIcon,
  AlertCircleIcon,
  LinkIcon,
  TrashIcon,
  PlusIcon,
  SearchIcon,
  Grid3X3Icon,
  ListIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  UploadIcon,
  DownloadIcon,
  ShareIcon,
  FileTextIcon,
  MoreVerticalIcon,
  EditIcon,
  UserIcon,
  BellIcon,
  HelpCircleIcon,
  MenuIcon,
  FolderIcon,
  FilmIcon,
  TargetIcon,
  PaletteIcon,
  VolumeXIcon,
  Volume2Icon,
  SkipBackIcon,
  SkipForwardIcon,
  PauseIcon,
  MaximizeIcon,
  ScissorsIcon,
  LayersIcon,
  TrendingDownIcon,
  StarIcon,
  MailIcon,
  SendIcon,
  UsersIcon,
  MessageSquareIcon,
  HomeIcon,
  YoutubeIcon,
  BarChart2Icon,
  KeyIcon,
  ShieldIcon,
  ArrowLeftIcon,
  TerminalIcon,
  CodeIcon,
  CopyIcon,
  Loader2Icon,
  RotateCcw,
  ChevronDownIcon,
  Brain,
  Eye,
  Zap,
  CheckCircle,
  XCircle,
  Mail,
  Send,
  Upload,
  PlayCircleIcon
};
`;

  await writeFile(centralIconsPath, centralIconContent);
}

async function fixIndexJsExports() {
  const indexPath = path.join(PROJECT_ROOT, 'src/components/Common/icons/index.js');
  const content = await readFile(indexPath);
  if (!content) return;

  // Fix the "as" syntax error
  let newContent = content.replace(
    /export\s*{\s*(\w+)\s+as\s+(\w+)\s*}/g,
    'export { $1 }'
  );

  // If there are import/export issues, rewrite the file
  if (newContent.includes('Unexpected token as')) {
    newContent = `// Icon exports
export * from './lucide-exports';
export * from './framer/index';
`;
  }

  await writeFile(indexPath, newContent);
}

async function removeUnusedImports(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  const content = await readFile(fullPath);
  if (!content) return;

  // Parse the file to find which icons are actually used
  const usedIcons = new Set();
  
  // Find all JSX elements that look like icons
  const jsxIconMatches = content.matchAll(/<(\w+Icon)\s*[/>]/g);
  for (const match of jsxIconMatches) {
    usedIcons.add(match[1]);
  }
  
  // Find all icon references in JavaScript
  const jsIconMatches = content.matchAll(/(\w+Icon)(?:\s*\(|\s*\.|\s*,|\s*}|\s*\)|\s*\]|\s*;)/g);
  for (const match of jsIconMatches) {
    usedIcons.add(match[1]);
  }

  // Special cases for icons used without "Icon" suffix
  const specialIcons = ['Brain', 'Eye', 'Zap', 'CheckCircle', 'XCircle', 'Mail', 'Send', 'Upload', 'RotateCcw'];
  for (const icon of specialIcons) {
    if (content.includes(`<${icon}`) || content.includes(`{${icon}}`)) {
      usedIcons.add(icon);
    }
  }

  // Build new import statement with only used icons
  const iconImports = [];
  const allIcons = [
    'TrendingUpIcon', 'SparklesIcon', 'BrainIcon', 'XIcon', 'VideoIcon', 'SettingsIcon',
    'LoaderIcon', 'ZapIcon', 'ActivityIcon', 'CheckCircleIcon', 'PlayIcon', 'EyeIcon',
    'AlertTriangleIcon', 'XCircleIcon', 'RefreshCwIcon', 'ClockIcon', 'CheckIcon',
    'AlertCircleIcon', 'LinkIcon', 'TrashIcon', 'PlusIcon', 'SearchIcon', 'Grid3X3Icon',
    'ListIcon', 'ArrowRightIcon', 'ChevronRightIcon', 'UploadIcon', 'DownloadIcon',
    'ShareIcon', 'FileTextIcon', 'MoreVerticalIcon', 'EditIcon', 'UserIcon', 'BellIcon',
    'HelpCircleIcon', 'MenuIcon', 'FolderIcon', 'FilmIcon', 'TargetIcon', 'PaletteIcon',
    'VolumeXIcon', 'Volume2Icon', 'SkipBackIcon', 'SkipForwardIcon', 'PauseIcon',
    'MaximizeIcon', 'ScissorsIcon', 'LayersIcon', 'TrendingDownIcon', 'StarIcon',
    'MailIcon', 'SendIcon', 'UsersIcon', 'MessageSquareIcon', 'HomeIcon', 'YoutubeIcon',
    'BarChart2Icon', 'KeyIcon', 'ShieldIcon', 'ArrowLeftIcon', 'TerminalIcon', 'CodeIcon',
    'CopyIcon', 'Loader2Icon', 'ChevronDownIcon', 'PlayCircleIcon'
  ];

  const iconMapping = {
    'TrendingUpIcon': 'TrendingUp',
    'SparklesIcon': 'Sparkles',
    'BrainIcon': 'Brain',
    'XIcon': 'X',
    'VideoIcon': 'Video',
    'SettingsIcon': 'Settings',
    'LoaderIcon': 'Loader',
    'ZapIcon': 'Zap',
    'ActivityIcon': 'Activity',
    'CheckCircleIcon': 'CheckCircle',
    'PlayIcon': 'Play',
    'EyeIcon': 'Eye',
    'AlertTriangleIcon': 'AlertTriangle',
    'XCircleIcon': 'XCircle',
    'RefreshCwIcon': 'RefreshCw',
    'ClockIcon': 'Clock',
    'CheckIcon': 'Check',
    'AlertCircleIcon': 'AlertCircle',
    'LinkIcon': 'Link',
    'TrashIcon': 'Trash',
    'PlusIcon': 'Plus',
    'SearchIcon': 'Search',
    'Grid3X3Icon': 'Grid3X3',
    'ListIcon': 'List',
    'ArrowRightIcon': 'ArrowRight',
    'ChevronRightIcon': 'ChevronRight',
    'UploadIcon': 'Upload',
    'DownloadIcon': 'Download',
    'ShareIcon': 'Share',
    'FileTextIcon': 'FileText',
    'MoreVerticalIcon': 'MoreVertical',
    'EditIcon': 'Edit',
    'UserIcon': 'User',
    'BellIcon': 'Bell',
    'HelpCircleIcon': 'HelpCircle',
    'MenuIcon': 'Menu',
    'FolderIcon': 'Folder',
    'FilmIcon': 'Film',
    'TargetIcon': 'Target',
    'PaletteIcon': 'Palette',
    'VolumeXIcon': 'VolumeX',
    'Volume2Icon': 'Volume2',
    'SkipBackIcon': 'SkipBack',
    'SkipForwardIcon': 'SkipForward',
    'PauseIcon': 'Pause',
    'MaximizeIcon': 'Maximize',
    'ScissorsIcon': 'Scissors',
    'LayersIcon': 'Layers',
    'TrendingDownIcon': 'TrendingDown',
    'StarIcon': 'Star',
    'MailIcon': 'Mail',
    'SendIcon': 'Send',
    'UsersIcon': 'Users',
    'MessageSquareIcon': 'MessageSquare',
    'HomeIcon': 'Home',
    'YoutubeIcon': 'Youtube',
    'BarChart2Icon': 'BarChart2',
    'KeyIcon': 'Key',
    'ShieldIcon': 'Shield',
    'ArrowLeftIcon': 'ArrowLeft',
    'TerminalIcon': 'Terminal',
    'CodeIcon': 'Code',
    'CopyIcon': 'Copy',
    'Loader2Icon': 'Loader2',
    'ChevronDownIcon': 'ChevronDown',
    'PlayCircleIcon': 'PlayCircle'
  };

  for (const icon of allIcons) {
    if (usedIcons.has(icon)) {
      const lucideName = iconMapping[icon] || icon.replace('Icon', '');
      iconImports.push(`${lucideName} as ${icon}`);
    }
  }

  // Add special icons without "Icon" suffix
  for (const icon of specialIcons) {
    if (usedIcons.has(icon) && !iconImports.some(imp => imp.includes(icon))) {
      iconImports.push(icon);
    }
  }

  if (iconImports.length > 0) {
    const newImport = `import {\n  ${iconImports.join(',\n  ')}\n} from 'lucide-react';`;
    
    // Remove existing lucide-react imports and add the new one
    let newContent = content.replace(/import\s*{[^}]*}\s*from\s*['"]lucide-react['"];?\s*\n?/g, '');
    
    // Find where to insert the new import
    const reactImportMatch = newContent.match(/import\s+React.*?;\s*\n/);
    if (reactImportMatch) {
      const insertPosition = reactImportMatch.index + reactImportMatch[0].length;
      newContent = newContent.slice(0, insertPosition) + newImport + '\n' + newContent.slice(insertPosition);
    } else {
      newContent = newImport + '\n\n' + newContent;
    }
    
    await writeFile(fullPath, newContent);
  }
}

async function fixAllFiles() {
  console.log('🔧 Starting comprehensive fix for OpenClip Pro...\n');

  // Step 1: Fix TypeScript errors
  console.log('📝 Fixing TypeScript errors...');
  await fixTypescriptErrors();

  // Step 2: Fix duplicate icon exports
  console.log('🔄 Fixing duplicate icon exports...');
  await fixDuplicateIconExports();

  // Step 3: Fix Processing Overlay duplicate imports
  console.log('🎨 Fixing ProcessingOverlay...');
  await fixProcessingOverlay();

  // Step 4: Fix Icon System Demo
  console.log('🖼️ Fixing IconSystemDemo...');
  await fixIconSystemDemo();

  // Step 5: Create centralized icon exports
  console.log('📦 Creating centralized icon exports...');
  await createMissingIconImports();

  // Step 6: Fix index.js exports
  console.log('📋 Fixing index.js exports...');
  await fixIndexJsExports();

  // Step 7: Fix icon imports in all problem files
  console.log('🔌 Fixing icon imports in components...');
  for (const file of filesToFixIcons) {
    await fixIconImports(file);
  }

  // Step 8: Remove unused imports from all files
  console.log('🧹 Cleaning up unused imports...');
  const allComponentFiles = [
    'src/App.tsx',
    'src/components/Analysis/AnalysisModal.jsx',
    'src/components/Beta/BetaSignupModal.jsx',
    'src/components/Beta/UsageTracker.jsx',
    'src/components/Common/AnimatedContainer.jsx',
    'src/components/Common/AnimatedWaveBackground.jsx',
    'src/components/Common/BrainHero.jsx',
    'src/components/Common/ErrorBoundary.jsx',
    'src/components/Common/LogoDisplay.jsx',
    'src/components/Common/LogoDisplayDemo.jsx',
    'src/components/TestingPanel.tsx'
  ];

  for (const file of allComponentFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (await fileExists(fullPath)) {
      await removeUnusedImports(file);
    }
  }

  console.log('\n✅ All fixes completed!');
  console.log('\n📊 Next steps:');
  console.log('1. Run "npm test" to verify tests pass');
  console.log('2. Run "npm run dev" to test the development server');
  console.log('3. Run "npm run lint" to check for any remaining issues');
}

// Run the fix script
fixAllFiles().catch(console.error);