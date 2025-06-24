// Analytics utility for OpenClip Pro Beta
export const ANALYTICS_CONFIG = {
  trackingId: import.meta.env.VITE_GA_TRACKING_ID || 'GA_MEASUREMENT_ID',
  enabled: import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debugMode: import.meta.env.DEV
};

// Initialize Google Analytics
export const initializeAnalytics = () => {
  if (!ANALYTICS_CONFIG.enabled) {
    console.log('Analytics disabled in development');
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.trackingId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', ANALYTICS_CONFIG.trackingId, {
    debug_mode: ANALYTICS_CONFIG.debugMode,
    send_page_view: false // We'll handle page views manually
  });

  console.log('Analytics initialized:', ANALYTICS_CONFIG.trackingId);
};

// Track page views
export const trackPageView = (path, title) => {
  if (!ANALYTICS_CONFIG.enabled || !window.gtag) return;

  window.gtag('config', ANALYTICS_CONFIG.trackingId, {
    page_path: path,
    page_title: title
  });

  if (ANALYTICS_CONFIG.debugMode) {
    console.log('Page view tracked:', { path, title });
  }
};

// Track custom events
export const trackEvent = (eventName, parameters = {}) => {
  if (!ANALYTICS_CONFIG.enabled || !window.gtag) return;

  window.gtag('event', eventName, {
    event_category: parameters.category || 'general',
    event_label: parameters.label,
    value: parameters.value,
    custom_parameter_1: parameters.custom1,
    custom_parameter_2: parameters.custom2,
    ...parameters
  });

  if (ANALYTICS_CONFIG.debugMode) {
    console.log('Event tracked:', eventName, parameters);
  }
};

// Pre-defined event tracking functions
export const trackBetaSignup = (useCase, source = 'unknown') => {
  trackEvent('beta_signup', {
    category: 'conversion',
    label: useCase,
    custom1: source,
    value: 1
  });
};

export const trackVideoUpload = (fileSize, duration, format) => {
  trackEvent('video_upload', {
    category: 'engagement',
    label: format,
    value: Math.round(fileSize / 1024 / 1024), // MB
    custom1: Math.round(duration), // seconds
    custom2: format
  });
};

export const trackAIAnalysis = (provider, promptLength, processingTime) => {
  trackEvent('ai_analysis', {
    category: 'feature_usage',
    label: provider,
    value: Math.round(processingTime / 1000), // seconds
    custom1: promptLength,
    custom2: provider
  });
};

export const trackFeedback = (type, rating, source) => {
  trackEvent('feedback_submitted', {
    category: 'feedback',
    label: type,
    value: rating,
    custom1: source,
    custom2: type
  });
};

export const trackError = (errorType, errorMessage, context) => {
  trackEvent('exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    custom1: context,
    custom2: errorType
  });
};

export const trackFeatureUsage = (feature, context, value) => {
  trackEvent('feature_usage', {
    category: 'engagement',
    label: feature,
    value: value || 1,
    custom1: context,
    custom2: feature
  });
};

// Performance tracking
export const trackPerformance = (metric, value, context) => {
  trackEvent('performance', {
    category: 'performance',
    label: metric,
    value: Math.round(value),
    custom1: context,
    custom2: metric
  });
};

// User session tracking
export const trackSessionStart = () => {
  trackEvent('session_start', {
    category: 'engagement',
    value: 1
  });
};

export const trackSessionEnd = (duration) => {
  trackEvent('session_end', {
    category: 'engagement',
    value: Math.round(duration / 1000), // seconds
    custom1: Math.round(duration / 60000) // minutes
  });
};

// Conversion tracking
export const trackConversion = (type, value, context) => {
  trackEvent('conversion', {
    category: 'conversion',
    label: type,
    value: value,
    custom1: context,
    custom2: type
  });
};

export default {
  initialize: initializeAnalytics,
  trackPageView,
  trackEvent,
  trackBetaSignup,
  trackVideoUpload,
  trackAIAnalysis,
  trackFeedback,
  trackError,
  trackFeatureUsage,
  trackPerformance,
  trackSessionStart,
  trackSessionEnd,
  trackConversion
}; 