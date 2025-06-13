import apiClient from '../utils/apiClient';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('access_token');
    this.refreshToken = null; // Will be stored in HTTP-only cookie
    this.user = this.getStoredUser();
    
    // Set up axios interceptor for authentication
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Add token to requests
    apiClient.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle token refresh on 401 responses
    apiClient.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${this.token}`;
            return apiClient.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            this.logout();
            window.location.href = '/';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(credentials) {
    try {
      // Backend expects form data for OAuth2 compliance
      const formData = new URLSearchParams();
      formData.append('username', credentials.email); // OAuth2 uses 'username'
      formData.append('password', credentials.password);

      const response = await apiClient.client.post('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true, // Include cookies for refresh token
      });

      const { access_token, user } = response.data;

      // Store token and user data
      this.token = access_token;
      this.user = user;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  }

  async register(userData) {
    try {
      const response = await apiClient.client.post('/api/auth/register', {
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
      });

      return { 
        success: true, 
        message: 'Registration successful! Please verify your email.' 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  }

  async refreshAccessToken() {
    try {
      const response = await apiClient.client.post('/api/auth/refresh', {}, {
        withCredentials: true, // Include refresh token cookie
      });

      const { access_token } = response.data;
      this.token = access_token;
      localStorage.setItem('access_token', access_token);

      return access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      if (!this.token) {
        return null;
      }

      const response = await apiClient.client.get('/api/auth/me');
      const user = response.data;
      
      // Update stored user data
      this.user = user;
      localStorage.setItem('user_data', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      // If we can't get user, token is likely invalid
      this.logout();
      return null;
    }
  }

  async logout() {
    try {
      // Call logout endpoint to clear refresh token cookie
      await apiClient.client.post('/api/auth/logout', {}, {
        withCredentials: true,
      });
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    }

    // Clear local storage
    this.token = null;
    this.user = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
  }

  getStoredUser() {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  hasRole(role) {
    return this.user?.roles?.includes(role) || false;
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  // Utility method to check if we should attempt authentication
  async checkAuthStatus() {
    if (!this.token) {
      return false;
    }

    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
