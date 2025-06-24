import apiClient from '../utils/apiClient';

class AuthService {
  constructor() {
    this.tokenKey = 'access_token';
    this.userKey = 'user_data';
  }

  async login({ email, password }) {
    try {
      const response = await fetch('http://localhost:8001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.access_token) {
          localStorage.setItem(this.tokenKey, data.access_token);
          localStorage.setItem(this.userKey, JSON.stringify(data.user || {}));
          return { success: true, user: data.user };
        }
      }

      const errorData = await response.json();
      return { success: false, error: errorData.detail || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Failed to login',
      };
    }
  }

  async register(userData) {
    try {
      const response = await apiClient.register({
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
      });

      if (response && response.access_token) {
        localStorage.setItem(this.tokenKey, response.access_token);
        localStorage.setItem(this.userKey, JSON.stringify(response.user || {}));
        return { success: true, user: response.user };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Failed to register',
      };
    }
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    return true;
  }

  isAuthenticated() {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getAccessToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getUser() {
    const userData = localStorage.getItem(this.userKey);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async refreshAccessToken() {
    try {
      // For now, just return the current token since we don't have refresh token implementation
      const currentToken = this.getToken();
      if (currentToken) {
        return currentToken;
      }
      throw new Error('No token available');
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, log the user out
      this.logout();
      throw error;
    }
  }

  async autoLoginForDevelopment() {
    try {
      // Auto-login with default admin credentials for development
      const result = await this.login({
        email: 'admin@openclippro.com',
        password: 'admin123!',
      });

      if (result.success) {
        console.log('Auto-logged in for development');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auto-login failed:', error);
      return false;
    }
  }

  async ensureAuthenticated() {
    // Check if already authenticated
    if (this.isAuthenticated()) {
      return true;
    }

    // Try auto-login for development
    return await this.autoLoginForDevelopment();
  }
}

const authService = new AuthService();
export default authService;
