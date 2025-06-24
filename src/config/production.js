/**
 * Production configuration for OpenClip Pro
 * This file contains production-specific settings and optimizations
 */

// Environment configuration
export const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'production';
export const IS_PRODUCTION = ENVIRONMENT === 'production';
export const IS_DEVELOPMENT = ENVIRONMENT === 'development';

// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.openclippro.com',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

// Application Configuration
export const APP_CONFIG = {
  name: 'OpenClip Pro',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  description: 'AI-powered video clipping application',
  maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
  supportedVideoFormats: ['mp4', 'avi', 'mov', 'mkv', 'webm'],
  maxVideoLength: 7200, // 2 hours in seconds
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  // Lazy loading
  enableLazyLoading: true,
  lazyLoadingThreshold: 0.1,

  // Caching
  enableServiceWorker: IS_PRODUCTION,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  // Chunking
  enableCodeSplitting: IS_PRODUCTION,
  chunkSize: 244 * 1024, // 244KB

  // Compression
  enableGzip: IS_PRODUCTION,
  compressionLevel: 6,

  // Image optimization
  imageOptimization: {
    quality: 85,
    progressive: true,
    webp: true,
  },

  // Video optimization
  videoOptimization: {
    preload: 'metadata',
    poster: true,
    lazy: true,
  },
};

// Security Configuration
export const SECURITY_CONFIG = {
  // HTTPS enforcement
  enforceHTTPS: IS_PRODUCTION,

  // Content Security Policy
  csp: {
    enabled: IS_PRODUCTION,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      fontSrc: ["'self'", 'data:'],
      mediaSrc: ["'self'", 'blob:'],
    },
  },

  // Rate limiting
  rateLimiting: {
    enabled: IS_PRODUCTION,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // CORS
  cors: {
    enabled: true,
    origins: IS_PRODUCTION
      ? ['https://openclippro.com', 'https://www.openclippro.com']
      : ['http://localhost:3000', 'http://localhost:5173'],
  },
};

// Monitoring Configuration
export const MONITORING_CONFIG = {
  // Analytics
  analytics: {
    enabled: IS_PRODUCTION,
    trackingId: import.meta.env.VITE_GA_TRACKING_ID,
  },

  // Error tracking
  errorTracking: {
    enabled: IS_PRODUCTION,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: ENVIRONMENT,
    release: import.meta.env.VITE_APP_VERSION,
  },

  // Performance monitoring
  performance: {
    enabled: true,
    sampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    metrics: ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'],
  },

  // User feedback
  feedback: {
    enabled: IS_PRODUCTION,
    email: 'feedback@openclippro.com',
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  // AI Features
  openaiIntegration: true,
  geminiIntegration: true,
  anthropicIntegration: true,
  localModelSupport: true,

  // Video Features
  youtubeIntegration: true,
  videoUpload: true,
  videoStreaming: true,
  thumbnailGeneration: true,

  // UI Features
  darkMode: true,
  responsiveDesign: true,
  animations: !IS_PRODUCTION || !window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  // Beta Features - ENABLED for beta launch
  betaProgram: true,
  betaSignup: true,
  feedbackWidget: true,
  usageTracking: true,
  onboarding: true,
  
  // Experimental Features
  experimentalFeatures: IS_DEVELOPMENT,
  betaFeatures: true, // ENABLED for beta launch

  // Social Features
  sharing: true,
  collaboration: false,
  comments: false,
};

// Theming Configuration
export const THEME_CONFIG = {
  defaultTheme: 'dark',
  themes: ['light', 'dark', 'system'],
  customThemes: IS_PRODUCTION,

  // Glassmorphism settings
  glassmorphism: {
    enabled: true,
    blur: 10,
    opacity: 0.8,
    borderRadius: 12,
  },

  // Animation settings
  animations: {
    enabled: FEATURE_FLAGS.animations,
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Optimization Settings
export const OPTIMIZATION_CONFIG = {
  // Bundle optimization
  bundleOptimization: {
    treeshaking: IS_PRODUCTION,
    minification: IS_PRODUCTION,
    compression: IS_PRODUCTION,
    sourcemaps: IS_DEVELOPMENT,
  },

  // Runtime optimization
  runtimeOptimization: {
    memoization: true,
    virtualization: true,
    debouncing: true,
    throttling: true,
  },

  // Network optimization
  networkOptimization: {
    http2: IS_PRODUCTION,
    preloading: IS_PRODUCTION,
    prefetching: IS_PRODUCTION,
    caching: IS_PRODUCTION,
  },
};

// Development Tools
export const DEV_CONFIG = {
  // Debug tools
  debugMode: IS_DEVELOPMENT,
  verboseLogging: IS_DEVELOPMENT,
  reactDevTools: IS_DEVELOPMENT,

  // Testing
  testMode: import.meta.env.VITE_TEST_MODE === 'true',
  mockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',

  // Hot reloading
  hotReload: IS_DEVELOPMENT,
  fastRefresh: IS_DEVELOPMENT,
};

// Export configuration object
export const CONFIG = {
  ENVIRONMENT,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  API_CONFIG,
  APP_CONFIG,
  PERFORMANCE_CONFIG,
  SECURITY_CONFIG,
  MONITORING_CONFIG,
  FEATURE_FLAGS,
  THEME_CONFIG,
  OPTIMIZATION_CONFIG,
  DEV_CONFIG,
};

export default CONFIG;
