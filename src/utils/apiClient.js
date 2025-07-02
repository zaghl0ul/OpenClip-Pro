import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Custom API Error class to provide more context
export class APIError extends Error {
  constructor(message, statusCode = 0, response = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add request interceptor to handle authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with non-2xx status
      console.error('API Error:', error.response.data);
      const errorMessage =
        error.response.data.detail || error.response.data.message || 'API request failed';
      return Promise.reject(new APIError(errorMessage, error.response.status, error.response));
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
      return Promise.reject(new APIError('Network error. Please check your connection.', 0, null));
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject(new APIError(error.message, 0, null));
    }
  }
);

// Add API methods to the client
apiClient.getProjects = () => apiClient.get('/api/v1/projects');
apiClient.getProject = (id) => apiClient.get(`/api/v1/projects/${id}`);
apiClient.createProject = (data) => {
  if (data instanceof FormData) {
    return apiClient.post('/api/v1/projects', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return apiClient.post('/api/v1/projects', data);
};
apiClient.updateProject = (id, data) => apiClient.put(`/api/v1/projects/${id}`, data);
apiClient.deleteProject = (id) => apiClient.delete(`/api/v1/projects/${id}`);

// Video methods
apiClient.uploadVideo = async (projectId, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post(`/api/v1/projects/${projectId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
};

apiClient.getVideoStream = (projectId) => apiClient.get(`/api/v1/projects/${projectId}/stream`);

// YouTube methods
apiClient.getYouTubeInfo = (url) => apiClient.post('/api/v1/youtube/info', { url });
apiClient.processYouTube = (projectId, youtubeUrl) => {
  return apiClient.post(`/api/v1/projects/${projectId}/youtube`, { youtube_url: youtubeUrl });
};

// Analysis methods
apiClient.analyzeVideo = (projectId, prompt, provider = 'openai', model = null) => {
  return apiClient.post(`/api/v1/projects/${projectId}/analyze`, {
    prompt,
    provider,
    model,
  });
};

// Clip methods
apiClient.updateClip = (clipId, updates) => apiClient.put(`/api/v1/clips/${clipId}`, updates);
apiClient.deleteClip = (clipId) => apiClient.delete(`/api/v1/clips/${clipId}`);
apiClient.exportClips = (projectId, settings) =>
  apiClient.post(`/api/v1/projects/${projectId}/export`, settings);
apiClient.exportClip = (clipId, settings) =>
  apiClient.post(`/api/v1/clips/${clipId}/export`, settings);

// Search methods
apiClient.searchProjects = (query, filters = {}) => {
  return apiClient.post('/api/v1/projects/search', { query, filters });
};

// Provider methods
apiClient.getProviders = () => apiClient.get('/api/v1/providers');
apiClient.getModels = (provider) => apiClient.get(`/api/v1/models/${provider}`);

// Settings methods
apiClient.getSettings = () => apiClient.get('/api/v1/settings');
apiClient.updateSettings = (settings) => apiClient.post('/api/v1/settings', settings);

// API Key methods
apiClient.saveApiKey = (provider, apiKey) => {
  return apiClient.post('/api/v1/settings/api-keys', { provider, api_key: apiKey });
};

apiClient.testApiKey = (provider, apiKey) => {
  return apiClient.post('/api/v1/settings/test-api-key', { provider, api_key: apiKey });
};

apiClient.deleteApiKey = (provider) => {
  return apiClient.delete(`/api/v1/settings/api-keys/${provider}`);
};

export default apiClient;
