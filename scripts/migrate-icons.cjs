#!/usr/bin/env node

/**
 * Automated Icon Migration Script
 * Converts old Framer Motion icon usage to new Lucide React system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.magenta}🚀 ${msg}${colors.reset}`),
};

function findReactFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && /\.(jsx?|tsx?)$/.test(item)) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Update icon usage patterns - more comprehensive regex
    content = content.replace(
      /<(\w+Icon)\s+size=\{(\d+)\}\s+className="[^"]*w-\d+[^"]*h-\d+[^"]*"([^>]*)\/>/g,
      '<Icon icon={$1} size={$2}$3 />'
    );

    // Handle basic icon patterns
    content = content.replace(
      /<(\w+Icon)(\s+[^>]*)?\/>/g,
      '<Icon icon={$1}$2 />'
    );

    // Update imports to include Icon component
    if (content.includes('<Icon ') && content.includes("from '../Common/icons'")) {
      content = content.replace(
        /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]\.\.\/Common\/icons['"];?/g,
        (match, icons) => {
          const iconList = icons.split(',').map(icon => icon.trim());
          if (!iconList.includes('Icon')) {
            iconList.unshift('Icon');
          }
          return `import { ${iconList.join(', ')} } from '../Common/icons';`;
        }
      );
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      log.success(`Migrated: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    log.error(`Failed to migrate ${filePath}: ${error.message}`);
    return false;
  }
}
function installDependencies() {
  log.info('Installing Lucide React...');
  try {
    execSync('npm install lucide-react@^0.263.1', { stdio: 'inherit' });
    log.success('Lucide React installed successfully');
  } catch (error) {
    log.error(`Failed to install dependencies: ${error.message}`);
    process.exit(1);
  }
}

function removeOldIconFiles() {
  const oldIconFiles = [
    'src/components/Common/icons/framer',
    'src/components/Common/icons/FramerBaseIcon.jsx'
  ];

  oldIconFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      try {
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        log.success(`Removed: ${filePath}`);
      } catch (error) {
        log.warning(`Could not remove ${filePath}: ${error.message}`);
      }
    }
  });
}

function main() {
  log.header('OpenClip Pro Icon System Migration');
  
  console.log(`
${colors.cyan}
🎯 This script will:
   1. Install Lucide React dependency
   2. Migrate all icon usage to new system
   3. Remove old icon files
   4. Generate a migration report
${colors.reset}
  `);

  const stats = {
    totalFiles: 0,
    migratedFiles: 0
  };

  // Step 1: Install dependencies
  log.info('Step 1: Installing dependencies...');
  installDependencies();

  // Step 2: Migrate files
  log.info('Step 2: Migrating icon usage...');
  const files = findReactFiles('src');
  stats.totalFiles = files.length;

  files.forEach(file => {
    if (migrateFile(file)) {
      stats.migratedFiles++;
    }
  });

  // Step 3: Remove old files
  log.info('Step 3: Removing old icon files...');
  removeOldIconFiles();

  log.header('Migration Complete! 🎉');
  console.log(`
${colors.green}
✅ Successfully migrated ${stats.migratedFiles} out of ${stats.totalFiles} files
✅ New icon system ready to use

Next steps:
1. Run: npm run dev
2. Test all icon functionality
3. Read ICON_MIGRATION_GUIDE.md for usage examples
${colors.reset}
  `);
}

if (require.main === module) {
  main();
}

module.exports = { migrateFile, findReactFiles };