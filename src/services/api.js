// API service with authentication
import debug from '../utils/debug';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    debug.log('API', 'API Service initialized', { baseURL: this.baseURL });
  }

  getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    debug.logApiCall(endpoint, options.method || 'GET', options.body);

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        debug.log('API', 'Authentication error, clearing tokens');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        window.location.reload();
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || `HTTP ${response.status}`);
      }
      
      debug.logApiResponse(endpoint, data);
      return data;
    } catch (error) {
      debug.logApiError(endpoint, error);
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(email, password, full_name) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name })
    });
  }

  async verifyToken() {
    return this.request('/auth/verify-token');
  }

  // Health check (no auth required)
  async healthCheck() {
    return fetch(`${this.baseURL}/health`).then(res => res.json());
  }

  // Projects
  async getProjects() {
    return this.request('/api/projects');
  }

  async getProject(id) {
    return this.request(`/api/projects/${id}`);
  }

  async createProject(projectData) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(id) {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE'
    });
  }

  // Video upload
  async uploadVideo(projectId, file) {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${this.baseURL}/api/projects/${projectId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      return data;
    });
  }

  // YouTube processing
  async processYouTube(projectId, youtubeUrl) {
    return this.request(`/api/projects/${projectId}/youtube`, {
      method: 'POST',
      body: JSON.stringify({ youtube_url: youtubeUrl })
    });
  }

  // Analysis
  async analyzeVideo(projectId, prompt, provider = 'openai', model = null) {
    return this.request(`/api/projects/${projectId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        prompt,
        provider,
        model
      })
    });
  }

  // AI Providers
  async getProviders() {
    return this.request('/api/providers');
  }

  async getModels(provider) {
    return this.request(`/api/models/${provider}`);
  }

  // Settings
  async getSettings() {
    return this.request('/api/settings');
  }

  async setApiKey(provider, apiKey) {
    return this.request('/api/settings/api-key', {
      method: 'POST',
      body: JSON.stringify({ provider, api_key: apiKey })
    });
  }

  async updateSetting(category, key, value) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ category, key, value })
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;