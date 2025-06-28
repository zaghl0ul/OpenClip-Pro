import React, { useRef, useEffect } from 'react';

// Performance monitoring and optimization utilities

// Performance state
let performanceMetrics = {
  pageLoadTime: 0,
  componentRenderTimes: {},
  memoryUsage: {},
  fps: 0,
  slowOperations: [],
};

// Performance mode state
let performanceModeEnabled = localStorage.getItem('openclip_performance_mode') === 'true';

// Device performance detection
export const detectDevicePerformance = () => {
  const navigator = window.navigator;
  const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  // Rough performance scoring based on available metrics
  let score = 0;

  // Memory scoring (0-30 points)
  if (memory >= 8) score += 30;
  else if (memory >= 4) score += 20;
  else if (memory >= 2) score += 10;

  // CPU scoring (0-30 points)
  if (hardwareConcurrency >= 8) score += 30;
  else if (hardwareConcurrency >= 4) score += 20;
  else if (hardwareConcurrency >= 2) score += 10;

  // Connection scoring (0-20 points)
  const connection = navigator.connection;
  if (connection) {
    if (connection.effectiveType === '4g') score += 20;
    else if (connection.effectiveType === '3g') score += 10;
    else if (connection.effectiveType === '2g') score += 5;
  } else {
    score += 15; // Default for unknown connection
  }

  // Battery scoring (0-20 points)
  if (navigator.getBattery) {
    navigator.getBattery().then((battery) => {
      if (battery.charging || battery.level > 0.5) score += 20;
      else if (battery.level > 0.2) score += 10;
    });
  } else {
    score += 15; // Default for unknown battery
  }

  // Classify performance level
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

// Auto-enable performance mode
export const enablePerformanceMode = () => {
  if (performanceModeEnabled) return; // Already enabled
  
  performanceModeEnabled = true;
  console.log('🚀 Performance mode enabled automatically due to low FPS');
  
  // Dispatch a custom event to notify components
  window.dispatchEvent(new CustomEvent('enablePerformanceMode', {
    detail: { reason: 'low_fps' }
  }));
  
  // Store preference in localStorage
  localStorage.setItem('openclip_performance_mode', 'true');
};

// Performance monitoring
export const startPerformanceMonitoring = () => {
  // Monitor memory usage less frequently
  const monitorMemory = () => {
    if (performance.memory) {
      performanceMetrics.memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }
  };

  // Throttled FPS monitoring to reduce console spam
  let frameCount = 0;
  let lastTime = performance.now();
  let lastWarningTime = 0;
  let warningCount = 0;
  const WARNING_COOLDOWN = 10000; // 10 seconds between warnings
  const MAX_WARNINGS = 3; // Maximum warnings before stopping

  const monitorFPS = () => {
    frameCount++;
    const currentTime = performance.now();
    
    // Check FPS every 3 seconds instead of 2
    if (currentTime - lastTime >= 3000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      performanceMetrics.fps = fps;
      
      // Only warn if FPS is critically low AND we haven't warned recently
      const shouldWarn = fps < 10 && 
                        frameCount > 20 && 
                        (currentTime - lastWarningTime) > WARNING_COOLDOWN &&
                        warningCount < MAX_WARNINGS;
      
      if (shouldWarn) {
        console.warn(`Performance: Low FPS detected (${fps}fps). Consider enabling performance mode.`);
        lastWarningTime = currentTime;
        warningCount++;
        
        // Auto-enable performance mode if FPS is critically low
        if (fps < 5) {
          enablePerformanceMode();
        }
      }
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    // Reduce monitoring frequency significantly after warnings
    const delay = warningCount >= MAX_WARNINGS ? 5000 : 1000;
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        requestAnimationFrame(monitorFPS);
      }
    }, delay);
  };

  // Start monitoring with delayed initialization
  setInterval(monitorMemory, 10000); // Every 10 seconds instead of 5

  // Delay FPS monitoring to let the app settle and only monitor when page is visible
  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      requestAnimationFrame(monitorFPS);
    }
  }, 5000); // Start FPS monitoring after 5 seconds

  // Pause monitoring when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Reset warning state when page becomes hidden
      warningCount = 0;
      lastWarningTime = 0;
    }
  });

  // Monitor page load time
  window.addEventListener('load', () => {
    setTimeout(() => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      performanceMetrics.pageLoadTime = loadTime;

      if (loadTime > 5000) { // Increased threshold
        console.warn(`Performance: Slow page load detected (${loadTime}ms)`);
      }
    }, 0);
  });
};

// Component performance wrapper
export const withPerformanceTracking = (Component, name) => {
  const WrappedComponent = React.forwardRef((props, ref) => {
    const startTime = useRef(performance.now());

    useEffect(() => {
      const renderTime = performance.now() - startTime.current;
      performanceMetrics.componentRenderTimes[name] = renderTime;

      // Increased threshold and reduce logging
      if (renderTime > 200) {
        console.warn(`Slow component render: ${name} took ${renderTime.toFixed(2)}ms`);
      }
    });

    return React.createElement(Component, { ...props, ref });
  });

  WrappedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

// Performance optimization suggestions
export const getPerformanceOptimizations = () => {
  const suggestions = [];

  // Memory usage suggestions
  if (performanceMetrics.memoryUsage.used > performanceMetrics.memoryUsage.limit * 0.8) {
    suggestions.push({
      type: 'memory',
      message: 'High memory usage detected. Consider reducing animations or component complexity.',
      severity: 'high',
    });
  }

  // FPS suggestions
  if (performanceMetrics.fps < 30) {
    suggestions.push({
      type: 'fps',
      message: 'Low frame rate detected. Consider enabling performance mode.',
      severity: 'high',
    });
  }

  // Component render time suggestions
  Object.entries(performanceMetrics.componentRenderTimes).forEach(([name, time]) => {
    if (time > 100) {
      suggestions.push({
        type: 'render',
        message: `Component ${name} is rendering slowly (${time.toFixed(2)}ms).`,
        severity: 'medium',
      });
    }
  });

  return suggestions;
};

// Auto-optimization based on performance
export const getOptimalSettings = () => {
  const devicePerformance = detectDevicePerformance();
  const fps = performanceMetrics.fps;
  const memoryUsage = performanceMetrics.memoryUsage.used / performanceMetrics.memoryUsage.total;

  let settings = {
    animationsEnabled: true,
    particleCount: 'normal',
    qualityLevel: 'high',
    performanceMode: false,
  };

  // Adjust based on device performance
  if (devicePerformance === 'low' || fps < 30 || memoryUsage > 0.8) {
    settings = {
      animationsEnabled: false,
      particleCount: 'low',
      qualityLevel: 'low',
      performanceMode: true,
    };
  } else if (devicePerformance === 'medium' || fps < 45 || memoryUsage > 0.6) {
    settings = {
      animationsEnabled: true,
      particleCount: 'reduced',
      qualityLevel: 'medium',
      performanceMode: false,
    };
  }

  return settings;
};

// Lazy loading utility
export const createLazyComponent = (importFn, fallback = null) => {
  return React.lazy(() => {
    const startTime = performance.now();

    return importFn().then((module) => {
      const loadTime = performance.now() - startTime;
      console.debug(`Component loaded in ${loadTime.toFixed(2)}ms`);

      if (loadTime > 1000) {
        console.warn(`Slow component load: ${loadTime.toFixed(2)}ms`);
      }

      return module;
    });
  });
};

// Animation performance utilities
export const getOptimalAnimationSettings = () => {
  const devicePerformance = detectDevicePerformance();
  const fps = performanceMetrics.fps;

  if (devicePerformance === 'low' || fps < 30) {
    return {
      duration: 2, // Shorter animations
      ease: 'easeOut', // Simpler easing
      reduce: true, // Reduce motion preference
    };
  }

  if (devicePerformance === 'medium' || fps < 45) {
    return {
      duration: 1.5,
      ease: 'easeInOut',
      reduce: false,
    };
  }

  return {
    duration: 1,
    ease: 'easeInOut',
    reduce: false,
  };
};

// Export metrics for debugging
export const getPerformanceMetrics = () => performanceMetrics;

// Clear metrics
export const clearPerformanceMetrics = () => {
  performanceMetrics = {
    pageLoadTime: 0,
    componentRenderTimes: {},
    memoryUsage: {},
    fps: 0,
    slowOperations: [],
  };
};

export default {
  detectDevicePerformance,
  startPerformanceMonitoring,
  withPerformanceTracking,
  getPerformanceOptimizations,
  getOptimalSettings,
  createLazyComponent,
  getOptimalAnimationSettings,
  getPerformanceMetrics,
  clearPerformanceMetrics,
  enablePerformanceMode,
};
