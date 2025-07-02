// API service with authentication
import debug from '../utils/debug';
import apiClient from '../utils/apiClient';

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
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
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
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email, password, full_name) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  async verifyToken() {
    return this.request('/auth/verify-token');
  }

  // Health check (no auth required)
  async healthCheck() {
    return fetch(`${this.baseURL}/health`).then((res) => res.json());
  }

  // Projects
  async getProjects() {
    return this.request('/api/v1/projects');
  }

  async getProject(id) {
    return this.request(`/api/v1/projects/${id}`);
  }

  async createProject(projectData) {
    return this.request('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id) {
    return this.request(`/api/v1/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Video upload
  async uploadVideo(projectId, file) {
    console.log('🔄 Starting video upload...');
    console.log('📁 File info:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });
    console.log('🆔 Project ID:', projectId);

    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);

    console.log(
      '📤 Sending upload request to:',
      `${this.baseURL}/api/v1/projects/${projectId}/upload`
    );

    return fetch(`${this.baseURL}/api/v1/projects/${projectId}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then(async (res) => {
        console.log('📥 Upload response status:', res.status);
        const data = await res.json();
        console.log('📥 Upload response data:', data);
        if (!res.ok) {
          console.error('❌ Upload failed:', data);
          throw new Error(data.detail || `Upload failed with status ${res.status}`);
        }
        console.log('✅ Upload successful!');
        return data;
      })
      .catch((error) => {
        console.error('❌ Upload error:', error);
        throw error;
      });
  }

  // YouTube processing
  async getYouTubeInfo(url) {
    return this.request('/api/youtube/info', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async downloadYouTubeVideo(projectId, url, analyze = true, analysisTypes = []) {
    return this.request(`/api/v1/projects/${projectId}/youtube`, {
      method: 'POST',
      body: JSON.stringify({
        youtube_url: url,
        analyze,
        analysis_types: analysisTypes,
      }),
    });
  }

  async getSupportedSites() {
    return this.request('/api/youtube/supported-sites');
  }

  async getAnalysisTypes() {
    return this.request('/api/ai/analysis-types');
  }

  // Analysis
  async analyzeVideo(projectId, prompt, provider = 'openai', model = null) {
    // Set default models for each provider if not specified
    if (!model) {
      switch (provider) {
        case 'openai':
          model = 'gpt-4-vision-preview';
          break;
        case 'gemini':
          model = 'gemini-1.5-flash';
          break;
        case 'anthropic':
          model = 'claude-3-opus-20240229';
          break;
        case 'lmstudio':
          model = 'local-model';
          break;
        default:
          model = 'gpt-4-vision-preview'; // fallback
      }
    }

    return this.request(`/api/v1/projects/${projectId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        prompt,
        provider,
        model,
      }),
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
      body: JSON.stringify({ provider, api_key: apiKey }),
    });
  }

  async updateSetting(category, key, value) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ category, key, value }),
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Project endpoints
export const getProjects = () => apiClient.get('/api/v1/projects');
export const getProject = (id) => apiClient.get(`/api/v1/projects/${id}`);
export const createProject = (formData) => apiClient.post('/api/v1/projects', formData);
export const updateProject = (id, data) => apiClient.put(`/api/v1/projects/${id}`, data);
export const deleteProject = (id) => apiClient.delete(`/api/v1/projects/${id}`);

// Video endpoints
export const getVideoStream = (projectId) => apiClient.get(`/api/v1/projects/${projectId}/stream`);

// Analysis endpoints
export const analyzeVideo = (projectId, prompt, provider = 'openai', model = null) => {
  // Set default models for each provider if not specified
  if (!model) {
    switch (provider) {
      case 'openai':
        model = 'gpt-4-vision-preview';
        break;
      case 'gemini':
        model = 'gemini-1.5-flash';
        break;
      case 'anthropic':
        model = 'claude-3-opus-20240229';
        break;
      case 'lmstudio':
        model = 'local-model';
        break;
      default:
        model = 'gpt-4-vision-preview'; // fallback
    }
  }

  return apiClient.post(`/api/v1/projects/${projectId}/analyze`, {
    prompt,
    provider,
    model,
  });
};

// Stats endpoints
export const getStats = () => apiClient.get('/api/stats');

// Provider endpoints
export const getProviders = () => apiClient.get('/api/providers');

// Settings endpoints
export const getSettings = () => apiClient.get('/api/settings');
