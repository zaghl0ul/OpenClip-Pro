import toast from 'react-hot-toast';

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  FILE_UPLOAD: 'FILE_UPLOAD_ERROR',
  API: 'API_ERROR',
  ANALYSIS: 'ANALYSIS_ERROR',
  PROCESSING: 'PROCESSING_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Error classification
const classifyError = (error) => {
  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.response?.status;

  if (status === 401 || message.includes('authentication') || message.includes('unauthorized')) {
    return { type: ERROR_TYPES.AUTHENTICATION, severity: ERROR_SEVERITY.HIGH };
  }

  if (status === 400 || message.includes('validation') || message.includes('invalid')) {
    return { type: ERROR_TYPES.VALIDATION, severity: ERROR_SEVERITY.MEDIUM };
  }

  if (message.includes('network') || message.includes('fetch') || status >= 500) {
    return { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.HIGH };
  }

  if (message.includes('file') || message.includes('upload')) {
    return { type: ERROR_TYPES.FILE_UPLOAD, severity: ERROR_SEVERITY.MEDIUM };
  }

  if (message.includes('analysis') || message.includes('ai')) {
    return { type: ERROR_TYPES.ANALYSIS, severity: ERROR_SEVERITY.MEDIUM };
  }

  if (message.includes('processing') || message.includes('youtube')) {
    return { type: ERROR_TYPES.PROCESSING, severity: ERROR_SEVERITY.MEDIUM };
  }

  return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.LOW };
};

// User-friendly error messages
const getErrorMessage = (error, context = '') => {
  const { type } = classifyError(error);
  const contextPrefix = context ? `${context}: ` : '';

  switch (type) {
    case ERROR_TYPES.AUTHENTICATION:
      return `${contextPrefix}Authentication required. Please log in again.`;
    case ERROR_TYPES.NETWORK:
      return `${contextPrefix}Network error. Please check your connection and try again.`;
    case ERROR_TYPES.VALIDATION:
      return `${contextPrefix}Invalid input. Please check your data and try again.`;
    case ERROR_TYPES.FILE_UPLOAD:
      return `${contextPrefix}File upload failed. Please try again with a valid video file.`;
    case ERROR_TYPES.ANALYSIS:
      return `${contextPrefix}AI analysis failed. Please check your API keys and try again.`;
    case ERROR_TYPES.PROCESSING:
      return `${contextPrefix}Processing failed. Please try again later.`;
    default:
      return `${contextPrefix}${error.message || 'An unexpected error occurred'}`;
  }
};

// Main error handler
export const handleError = (error, options = {}) => {
  const {
    context = '',
    showToast = true,
    logError = true,
    onError = null,
    customMessage = null,
  } = options;

  const classification = classifyError(error);
  const message = customMessage || getErrorMessage(error, context);

  // Log error for debugging
  if (logError) {
    console.error(`[${classification.type}] ${context}:`, {
      error,
      message,
      severity: classification.severity,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }

  // Show toast notification
  if (showToast) {
    const toastOptions = {
      duration: classification.severity === ERROR_SEVERITY.HIGH ? 6000 : 4000,
      position: 'top-right',
    };

    if (classification.severity === ERROR_SEVERITY.CRITICAL) {
      toast.error(message, { ...toastOptions, duration: 8000 });
    } else if (classification.severity === ERROR_SEVERITY.HIGH) {
      toast.error(message, toastOptions);
    } else {
      toast.error(message, { ...toastOptions, duration: 3000 });
    }
  }

  // Call custom error handler if provided
  if (onError) {
    onError(error, classification, message);
  }

  return {
    error,
    classification,
    message,
    handled: true,
  };
};

// Async error wrapper
export const withErrorHandler = (asyncFn, context = '', options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const handled = handleError(error, { context, ...options });

      // Re-throw if specified
      if (!options.suppressError) {
        throw error;
      }

      return handled;
    }
  };
};

// Error boundary helper
export const createErrorBoundaryHandler = (context) => {
  return (error, errorInfo) => {
    handleError(error, {
      context: `Error Boundary: ${context}`,
      logError: true,
      showToast: false, // Don't show toast for boundary errors
      onError: (err, classification) => {
        // Could send to error reporting service here
        console.error('Error Boundary triggered:', {
          error: err,
          errorInfo,
          classification,
          context,
        });
      },
    });
  };
};

// Network error retry utility
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const { type } = classifyError(error);

      // Don't retry authentication or validation errors
      if (type === ERROR_TYPES.AUTHENTICATION || type === ERROR_TYPES.VALIDATION) {
        throw error;
      }

      // Wait before retry
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
};

// Performance monitoring wrapper
export const withPerformanceMonitoring = (fn, name) => {
  return async (...args) => {
    const startTime = performance.now();
    let result;

    try {
      result = await fn(...args);
      return result;
    } catch (error) {
      handleError(error, { context: `Performance Monitor: ${name}` });
      throw error;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log slow operations
      if (duration > 5000) {
        // 5 seconds
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }

      // Could send to analytics service here
      console.debug(`Performance: ${name} completed in ${duration.toFixed(2)}ms`);
    }
  };
};

export default {
  handleError,
  withErrorHandler,
  withRetry,
  withPerformanceMonitoring,
  createErrorBoundaryHandler,
  ERROR_TYPES,
  ERROR_SEVERITY,
};
