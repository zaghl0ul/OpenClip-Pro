import axios from 'axios'
import authService from '../services/authService'

class APIError extends Error {
  constructor(message, statusCode, response = null) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.response = response
  }
}

class APIClient {
  constructor(baseURL = 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = authService.getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add timestamp to requests
        config.metadata = { startTime: new Date() }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = new Date() - response.config.metadata.startTime
        console.debug(`API Request completed in ${duration}ms:`, {
          url: response.config.url,
          method: response.config.method,
          status: response.status,
          duration
        })

        // Extract data from standardized response format
        if (response.data && response.data.status === 'success') {
          return response.data.data
        }
        
        return response.data
      },
      async (error) => {
        return this.handleError(error)
      }
    )
  }

  async handleError(error) {
    const duration = new Date() - error.config?.metadata?.startTime
    console.error(`API Request failed in ${duration}ms:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      duration
    })

    // Handle authentication errors
    if (error.response?.status === 401) {
      try {
        // Try to refresh token
        const newToken = await authService.refreshAccessToken()
        if (newToken) {
          // Retry original request with new token
          error.config.headers.Authorization = `Bearer ${newToken}`
          return this.client.request(error.config)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        authService.logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 1
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      return this.client.request(error.config)
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error - please check your connection'))
    }

    // Extract error message
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.message || 
                   'An unexpected error occurred'

    return Promise.reject(new Error(message))
  }

  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn()
      } catch (error) {
        if (i === maxRetries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  // Health check
  async healthCheck() {
    return this.client.get('/health')
  }

  // Authentication
  async login(credentials) {
    return this.client.post('/api/auth/login', credentials)
  }

  async register(userData) {
    return this.client.post('/api/auth/register', userData)
  }

  async refreshToken(refreshToken) {
    return this.client.post('/api/auth/refresh', { refresh_token: refreshToken })
  }

  async logout() {
    return this.client.post('/api/auth/logout')
  }

  async getCurrentUser() {
    return this.retryRequest(() => this.client.get('/api/auth/me'))
  }

  // Projects
  async getProjects() {
    const response = await this.retryRequest(() => this.client.get('/api/projects'))
    // Handle the backend response format: {"projects": [...]}
    return response.projects || response
  }

  async getProject(projectId) {
    return this.retryRequest(() => this.client.get(`/api/projects/${projectId}`))
  }

  async createProject(projectData) {
    return this.client.post('/api/projects', projectData)
  }

  async updateProject(projectId, updates) {
    return this.client.put(`/api/projects/${projectId}`, updates)
  }

  async deleteProject(projectId) {
    return this.client.delete(`/api/projects/${projectId}`)
  }

  async searchProjects(query, filters = {}) {
    const params = new URLSearchParams({
      query,
      ...filters
    })
    return this.retryRequest(() => this.client.get(`/api/projects/search?${params}`))
  }

  // Video upload and processing
  async uploadVideo(projectId, file, onProgress) {
    const formData = new FormData()
    formData.append('video', file)
    
    return this.client.post(`/api/projects/${projectId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
      timeout: 300000, // 5 minutes for large uploads
    })
  }

  async processYouTube(projectId, youtubeUrl) {
    return this.client.post(`/api/projects/${projectId}/youtube`, {
      url: youtubeUrl
    }, {
      timeout: 300000, // 5 minutes for YouTube processing
    })
  }

  // Analysis
  async analyzeVideo(projectId, prompt, provider = null, model = null) {
    const payload = {
      project_id: projectId,
      prompt,
    }

    if (provider) payload.provider = provider
    if (model) payload.model = model

    return this.client.post(`/api/projects/${projectId}/analyze`, payload, {
      timeout: 180000, // 3 minutes for analysis
    })
  }

  async getAnalysisStatus(projectId) {
    return this.retryRequest(() => this.client.get(`/api/projects/${projectId}/analysis/status`))
  }

  // Clips
  async getClips(projectId) {
    return this.retryRequest(() => this.client.get(`/api/projects/${projectId}/clips`))
  }

  async getClip(clipId) {
    return this.retryRequest(() => this.client.get(`/api/clips/${clipId}`))
  }

  async updateClip(clipId, updates) {
    return this.client.put(`/api/clips/${clipId}`, updates)
  }

  async deleteClip(clipId) {
    return this.client.delete(`/api/clips/${clipId}`)
  }

  // Export
  async exportClips(projectId, exportSettings) {
    return this.client.post(`/api/projects/${projectId}/export`, exportSettings, {
      timeout: 600000, // 10 minutes for export
    })
  }

  async exportClip(clipId, exportSettings) {
    return this.client.post(`/api/clips/${clipId}/export`, exportSettings, {
      timeout: 300000, // 5 minutes for single clip export
    })
  }

  async getExportStatus(exportId) {
    return this.retryRequest(() => this.client.get(`/api/exports/${exportId}/status`))
  }

  async downloadExport(exportId) {
    return this.client.get(`/api/exports/${exportId}/download`, {
      responseType: 'blob'
    })
  }

  // Settings
  async getUserSettings() {
    return this.retryRequest(() => this.client.get('/api/settings'))
  }

  async saveUserSettings(settings) {
    return this.client.post('/api/settings', settings)
  }

  async updateUserSetting(category, key, value) {
    return this.client.put('/api/settings', {
      category,
      key,
      value
    })
  }

  // API providers
  async getProviders() {
    return this.retryRequest(() => this.client.get('/api/providers'))
  }

  async getProviderModels(provider, apiKey) {
    return this.retryRequest(() => this.client.post(`/api/models/${provider}`, {
      api_key: apiKey
    }))
  }

  async testAPIConnection(provider, apiKey) {
    return this.client.post('/api/settings/test-api', {
      provider,
      api_key: apiKey,
    })
  }

  // Analytics
  async getAnalytics(timeRange = '7d') {
    return this.retryRequest(() => this.client.get(`/api/analytics?range=${timeRange}`))
  }

  async getProjectAnalytics(projectId) {
    return this.retryRequest(() => this.client.get(`/api/projects/${projectId}/analytics`))
  }

  // File management
  async uploadFile(file, onProgress) {
    const formData = new FormData()
    formData.append('file', file)
    
    return this.client.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  }

  async deleteFile(fileId) {
    return this.client.delete(`/api/files/${fileId}`)
  }

  // User management
  async updateProfile(profileData) {
    return this.client.put('/api/users/profile', profileData)
  }

  async changePassword(passwordData) {
    return this.client.post('/api/users/change-password', passwordData)
  }

  async deleteAccount() {
    return this.client.delete('/api/users/account')
  }

  // Teams (if implementing collaborative features)
  async getTeams() {
    return this.retryRequest(() => this.client.get('/api/teams'))
  }

  async createTeam(teamData) {
    return this.client.post('/api/teams', teamData)
  }

  async joinTeam(teamId, inviteCode) {
    return this.client.post(`/api/teams/${teamId}/join`, { invite_code: inviteCode })
  }

  // Notifications
  async getNotifications() {
    return this.retryRequest(() => this.client.get('/api/notifications'))
  }

  async markNotificationRead(notificationId) {
    return this.client.put(`/api/notifications/${notificationId}/read`)
  }

  async markAllNotificationsRead() {
    return this.client.put('/api/notifications/read-all')
  }

  // System
  async getSystemStatus() {
    return this.retryRequest(() => this.client.get('/api/system/status'))
  }

  async getSystemMetrics() {
    return this.retryRequest(() => this.client.get('/api/system/metrics'))
  }

  // Utility methods
  setBaseURL(url) {
    this.client.defaults.baseURL = url
  }

  setTimeout(timeout) {
    this.client.defaults.timeout = timeout
  }

  setHeaders(headers) {
    Object.assign(this.client.defaults.headers, headers)
  }
}

// Create singleton instance
const apiClient = new APIClient(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
)

// Export both the class and instance
export { APIClient, APIError }
export default apiClient 