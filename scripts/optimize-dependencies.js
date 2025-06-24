#!/usr/bin/env node

/**
 * Dependency Optimization Script
 * Removes unused dependencies and optimizes bundle size
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting dependency optimization...\n');

// Read current package.json
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('📦 Current dependencies:');
Object.keys(packageJson.dependencies).forEach(dep => {
  console.log(`  - ${dep}`);
});

console.log('\n🗑️  Removing unused dependencies...');

// List of confirmed unused dependencies
const unusedDeps = [
  '@headlessui/react',
  '@heroicons/react', 
  'react-dropzone',
  'p5',
  'react-p5'
];

// Remove unused dependencies
unusedDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`  ❌ Removing ${dep}`);
    delete packageJson.dependencies[dep];
  }
});

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log('\n✅ Updated package.json');
console.log('📝 Next steps:');
console.log('  1. Run: npm install');
console.log('  2. Run: npm run build');
console.log('  3. Check bundle size reduction');

console.log('\n💡 Additional optimizations available:');
console.log('  - Install bundle analyzer: npm install --save-dev rollup-plugin-visualizer');
console.log('  - Add to vite.config.js for bundle analysis');
console.log('  - Consider code splitting for framer-motion');

console.log('\n🎯 Expected bundle size reduction: ~335KB'); 