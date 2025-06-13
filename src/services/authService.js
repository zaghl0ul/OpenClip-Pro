import apiService from './api';

class AuthService {
  constructor() {
    this.tokenKey = 'access_token';
    this.userKey = 'user_data';
  }

  async login({ email, password }) {
    try {
      const response = await apiService.login(email, password);
      if (response && response.access_token) {
        localStorage.setItem(this.tokenKey, response.access_token);
        localStorage.setItem(this.userKey, JSON.stringify(response.user || {}));
        return { success: true, user: response.user };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to login' 
      };
    }
  }

  async register(userData) {
    try {
      const response = await apiService.register(
        userData.email, 
        userData.password, 
        userData.full_name
      );
      
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
        error: error.message || 'Failed to register' 
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
      const response = await apiService.verifyToken();
      if (response && response.access_token) {
        localStorage.setItem(this.tokenKey, response.access_token);
        return response.access_token;
      }
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, log the user out
      this.logout();
      throw error;
    }
  }
}

const authService = new AuthService();
export default authService; 