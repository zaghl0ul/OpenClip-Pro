// Input validation utilities for security and data integrity

// Email validation
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Password validation
export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password) && password.length <= 128;
};

// Project name validation
export const isValidProjectName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  // 1-100 characters, alphanumeric, spaces, hyphens, underscores
  const nameRegex = /^[a-zA-Z0-9\s\-_]{1,100}$/;
  return nameRegex.test(name.trim());
};

// URL validation (for YouTube URLs)
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// YouTube URL validation
export const isValidYouTubeUrl = (url) => {
  if (!isValidUrl(url)) return false;
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]{11}(&[\w=]*)?$/;
  return youtubeRegex.test(url);
};

// File validation
export const isValidVideoFile = (file) => {
  if (!file || typeof file !== 'object') return false;
  
  console.log('File validation - Name:', file.name, 'Type:', file.type, 'Size:', file.size);
  
  // Check file size first (500MB limit)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    console.log('File too large:', file.size, 'bytes (max:', maxSize, 'bytes)');
    return false;
  }
  
  // Primary MIME type check
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/mkv',
    'video/x-msvideo', // Alternative AVI type
    'video/quicktime', // Alternative MOV type
    'video/x-ms-wmv',  // Alternative WMV type
    'video/x-flv'      // Alternative FLV type
  ];
  
  // Check if MIME type is in allowed list
  if (allowedTypes.includes(file.type)) {
    console.log('File passed MIME type validation');
    return true;
  }
  
  // Fallback: Check file extension if MIME type is not recognized
  const allowedExtensions = [
    '.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'
  ];
  
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (hasValidExtension) {
    console.log('File passed extension validation');
    return true;
  }
  
  console.log('File validation failed - Type:', file.type, 'Name:', file.name);
  return false;
};

// Text sanitization
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 1000); // Limit length
};

// HTML sanitization (basic)
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  // Remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .trim();
};

// Numeric validation
export const isValidNumber = (value, min = -Infinity, max = Infinity) => {
  const num = Number(value);
  return !isNaN(num) && isFinite(num) && num >= min && num <= max;
};

// Duration validation (in seconds)
export const isValidDuration = (duration) => {
  return isValidNumber(duration, 0, 86400); // Max 24 hours
};

// Timestamp validation
export const isValidTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date instanceof Date && !isNaN(date.getTime());
};

// API key validation (basic format check)
export const isValidApiKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  
  // Basic format: 32-64 characters, alphanumeric and some special chars
  const apiKeyRegex = /^[a-zA-Z0-9\-_]{32,64}$/;
  return apiKeyRegex.test(key);
};

// UUID validation
export const isValidUuid = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Rate limiting validation
export const createRateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
    
    // Check current identifier
    const userRequests = requests.get(identifier) || [];
    const recentRequests = userRequests.filter(t => t > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    
    return true; // Request allowed
  };
};

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = rule.message || `${field} is required`;
        break;
      }
      
      if (value && rule.validator && !rule.validator(value)) {
        errors[field] = rule.message || `${field} is invalid`;
        break;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Security validation
export const validateSecurityHeaders = (headers) => {
  const requiredHeaders = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy'
  ];
  
  const missing = requiredHeaders.filter(header => !headers[header]);
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Input sanitization for search queries
export const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return '';
  
  return query
    .replace(/[^\w\s\-_.]/g, '') // Only allow word chars, spaces, hyphens, underscores, dots
    .trim()
    .slice(0, 100); // Limit length
};

// File path validation (prevent directory traversal)
export const isValidFilePath = (path) => {
  if (!path || typeof path !== 'string') return false;
  
  // Prevent directory traversal
  const dangerousPatterns = [
    '../',
    '..\\',
    '//',
    '\\\\',
    '~/',
    '$',
    '`',
    '|',
    ';',
    '&'
  ];
  
  return !dangerousPatterns.some(pattern => path.includes(pattern));
};

// Export validation rules for common use cases
export const validationRules = {
  email: [
    { required: true, message: 'Email is required' },
    { validator: isValidEmail, message: 'Please enter a valid email address' }
  ],
  password: [
    { required: true, message: 'Password is required' },
    { validator: isValidPassword, message: 'Password must be at least 8 characters with uppercase, lowercase, and number' }
  ],
  projectName: [
    { required: true, message: 'Project name is required' },
    { validator: isValidProjectName, message: 'Project name must be 1-100 characters, letters, numbers, spaces, hyphens, and underscores only' }
  ],
  youtubeUrl: [
    { required: true, message: 'YouTube URL is required' },
    { validator: isValidYouTubeUrl, message: 'Please enter a valid YouTube URL' }
  ]
};

export default {
  isValidEmail,
  isValidPassword,
  isValidProjectName,
  isValidUrl,
  isValidYouTubeUrl,
  isValidVideoFile,
  sanitizeText,
  sanitizeHtml,
  isValidNumber,
  isValidDuration,
  isValidTimestamp,
  isValidApiKey,
  isValidUuid,
  createRateLimiter,
  validateForm,
  validateSecurityHeaders,
  sanitizeSearchQuery,
  isValidFilePath,
  validationRules
}; 