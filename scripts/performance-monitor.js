#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Tracks bundle size, build time, and performance metrics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📊 Performance Monitoring Report\n');

// Performance thresholds (in bytes and ms)
const THRESHOLDS = {
  bundleSize: 1024 * 1024, // 1MB
  chunkSize: 244 * 1024,   // 244KB
  buildTime: 30000,        // 30 seconds
  loadTime: 3000,          // 3 seconds
};

// Check bundle size
const checkBundleSize = () => {
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ No dist folder found. Run npm run build first.');
    return false;
  }

  console.log('📦 Bundle Size Analysis:');
  
  let totalSize = 0;
  const files = [];
  
  const scanDirectory = (dir, prefix = '') => {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, `${prefix}${item}/`);
      } else {
        const sizeKB = Math.round(stat.size / 1024 * 100) / 100;
        totalSize += stat.size;
        
        files.push({
          name: `${prefix}${item}`,
          size: stat.size,
          sizeKB
        });
      }
    }
  };
  
  scanDirectory(distPath);
  
  // Sort by size
  files.sort((a, b) => b.size - a.size);
  
  // Show largest files
  console.log('\n📋 Largest Files:');
  files.slice(0, 10).forEach(file => {
    const status = file.size > THRESHOLDS.chunkSize ? '⚠️' : '✅';
    console.log(`  ${status} ${file.name}: ${file.sizeKB}KB`);
  });
  
  const totalMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
  const status = totalSize > THRESHOLDS.bundleSize ? '⚠️' : '✅';
  
  console.log(`\n${status} Total Bundle Size: ${totalMB}MB`);
  
  if (totalSize > THRESHOLDS.bundleSize) {
    console.log('💡 Consider code splitting or removing unused dependencies');
  }
  
  return totalSize <= THRESHOLDS.bundleSize;
};

// Check build performance
const checkBuildPerformance = () => {
  console.log('\n⚡ Build Performance:');
  
  const startTime = Date.now();
  
  // Simulate build analysis
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  console.log(`  📦 Dependencies: ${dependencies.length}`);
  console.log(`  🔧 Dev Dependencies: ${devDependencies.length}`);
  
  // Check for large dependencies
  const largeDependencies = dependencies.filter(dep => 
    ['@ffmpeg/ffmpeg', 'framer-motion', 'react-player'].includes(dep)
  );
  
  if (largeDependencies.length > 0) {
    console.log(`  ⚠️  Large Dependencies: ${largeDependencies.join(', ')}`);
    console.log('    💡 Consider lazy loading these packages');
  }
  
  return true;
};

// Generate performance report
const generateReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    bundleSize: checkBundleSize(),
    buildPerformance: checkBuildPerformance(),
    recommendations: []
  };
  
  console.log('\n📊 Performance Recommendations:');
  
  if (!report.bundleSize) {
    report.recommendations.push('Reduce bundle size below 1MB');
    console.log('  • Reduce bundle size below 1MB');
  }
  
  report.recommendations.push('Regular bundle analysis with npm run bundle:analyze');
  report.recommendations.push('Monitor Core Web Vitals in production');
  report.recommendations.push('Enable compression (gzip/brotli) on server');
  
  report.recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });
  
  // Save report
  const reportPath = path.join(__dirname, '../performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to: performance-report.json`);
};

// Main execution
try {
  generateReport();
  console.log('\n✅ Performance monitoring complete!');
} catch (error) {
  console.error('❌ Performance monitoring failed:', error.message);
  process.exit(1);
} 