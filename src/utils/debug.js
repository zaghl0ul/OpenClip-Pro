// Debug utilities for testing
const DEBUG = import.meta.env.MODE === 'development';

class DebugUtils {
  constructor() {
    this.logs = [];
    this.errors = [];
    
    // Expose to window in development
    if (DEBUG && typeof window !== 'undefined') {
      window._debug = this;
    }
  }

  log(category, message, data = null) {
    if (!DEBUG) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data
    };
    
    this.logs.push(entry);
    console.log(`[${category}]`, message, data || '');
  }

  error(category, error, context = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      category,
      error: error.message || error,
      stack: error.stack,
      context
    };
    
    this.errors.push(entry);
    console.error(`[${category} ERROR]`, error, context || '');
  }

  // API debugging
  logApiCall(endpoint, method, data) {
    this.log('API', `${method} ${endpoint}`, data);
  }

  logApiResponse(endpoint, response) {
    this.log('API', `Response from ${endpoint}`, response);
  }

  logApiError(endpoint, error) {
    this.error('API', error, { endpoint });
  }

  // State debugging
  logStateChange(store, action, newState) {
    this.log('STATE', `${store}.${action}`, newState);
  }

  // Component debugging
  logComponent(name, event, data) {
    this.log('COMPONENT', `${name} - ${event}`, data);
  }

  // Performance debugging
  startTimer(label) {
    if (!DEBUG) return;
    console.time(label);
  }

  endTimer(label) {
    if (!DEBUG) return;
    console.timeEnd(label);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.errors = [];
    console.clear();
  }

  // Export logs for debugging
  exportLogs() {
    return {
      logs: this.logs,
      errors: this.errors,
      timestamp: new Date().toISOString()
    };
  }

  // Test data generators
  generateTestProject() {
    return {
      name: `Test Project ${Date.now()}`,
      description: 'This is a test project for debugging',
      type: 'upload'
    };
  }

  generateTestAnalysisPrompt() {
    const prompts = [
      'Find all moments where someone is speaking',
      'Identify key highlights and transitions',
      'Extract scenes with text on screen',
      'Find all action sequences',
      'Identify emotional moments'
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  // Check system status
  async checkSystemStatus() {
    const status = {
      frontend: {
        react: typeof React !== 'undefined',
        router: typeof window !== 'undefined' && window.location,
        localStorage: typeof localStorage !== 'undefined',
        indexedDB: 'indexedDB' in window
      },
      performance: {
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
        } : 'Not available'
      },
      network: navigator.onLine,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth
      }
    };
    
    this.log('SYSTEM', 'System status check', status);
    return status;
  }

  // Test API connection
  async testApiConnection() {
    try {
      const response = await fetch('http://localhost:8001/health');
      const data = await response.json();
      this.log('API', 'Health check successful', data);
      return { success: true, data };
    } catch (error) {
      this.error('API', error, { endpoint: '/health' });
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const debug = new DebugUtils();

export default debug;
export { DEBUG }; 