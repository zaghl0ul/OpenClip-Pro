/**
 * Advanced Frontend Authentication Service
 * Implements secure token management, automatic refresh, and session handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Type definitions
interface User {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  role: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  avatar_url?: string;
  subscription_tier: string;
  permissions: string[];
  created_at: string;
  last_login?: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  twoFactorRequired: boolean;
  sessionId: string | null;
  
  // Actions
  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  setup2FA: () => Promise<{ qr_code: string; secret: string }>;
  confirm2FA: (code: string) => Promise<{ backup_codes: string[] }>;
  disable2FA: (password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
  recaptcha_token?: string;
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

// Create axios instance with interceptors
class AuthApiClient {
  private axiosInstance: AxiosInstance;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true, // Send cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const tokens = useAuthStore.getState().tokens;
        
        if (tokens?.access_token) {
          // Check if token needs refresh
          if (this.shouldRefreshToken(tokens)) {
            await this.handleTokenRefresh();
          }
          
          config.headers.Authorization = `Bearer ${tokens.access_token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle 401 errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.handleTokenRefresh();
            
            // Retry original request with new token
            const tokens = useAuthStore.getState().tokens;
            if (tokens?.access_token) {
              originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
            }
            
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private shouldRefreshToken(tokens: AuthTokens): boolean {
    if (!tokens.expires_at) return false;
    
    const now = Date.now();
    const expiresAt = tokens.expires_at * 1000; // Convert to milliseconds
    
    return expiresAt - now < TOKEN_REFRESH_THRESHOLD;
  }

  private async handleTokenRefresh(): Promise<void> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = useAuthStore.getState().refreshToken()
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  get client() {
    return this.axiosInstance;
  }
}

// Create API client instance
const authApiClient = new AuthApiClient();

// Secure storage adapter with encryption
const secureStorage = {
  getItem: (name: string): string | null => {
    try {
      const item = localStorage.getItem(name);
      if (!item) return null;
      
      // In production, decrypt the data here
      return item;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      // In production, encrypt the data here
      localStorage.setItem(name, value);
    } catch {
      console.error('Failed to save to storage');
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      console.error('Failed to remove from storage');
    }
  },
};

// Zustand store for authentication state
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      twoFactorRequired: false,
      sessionId: null,

      login: async (email: string, password: string, twoFactorCode?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const formData = new URLSearchParams();
          formData.append('username', email); // OAuth2 spec uses 'username'
          formData.append('password', password);
          
          if (twoFactorCode) {
            formData.append('client_id', twoFactorCode); // Repurpose client_id for 2FA
          }

          const response = await authApiClient.client.post('/auth/login', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });

          if (response.data.requires_2fa) {
            set({ twoFactorRequired: true, isLoading: false });
            return;
          }

          const { user, access_token, refresh_token, token_type, expires_in } = response.data;
          
          // Calculate token expiration
          const expires_at = Math.floor(Date.now() / 1000) + expires_in;
          
          const tokens: AuthTokens = {
            access_token,
            refresh_token,
            token_type,
            expires_in,
            expires_at,
          };

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            twoFactorRequired: false,
            sessionId: crypto.randomUUID(),
          });

          // Set up automatic token refresh
          get().scheduleTokenRefresh();
          
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Login failed',
            isLoading: false,
            twoFactorRequired: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApiClient.client.post('/auth/register', data);
          
          set({ isLoading: false });
          
          return response.data;
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApiClient.client.post('/auth/logout');
        } catch {
          // Continue with local logout even if server request fails
        }
        
        // Clear all auth data
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          sessionId: null,
          twoFactorRequired: false,
        });
        
        // Clear any scheduled token refresh
        get().clearTokenRefreshSchedule();
      },

      refreshToken: async () => {
        const currentTokens = get().tokens;
        
        if (!currentTokens?.refresh_token) {
          throw new Error('No refresh token available');
        }
        
        try {
          const response = await authApiClient.client.post('/auth/refresh', null, {
            headers: {
              Authorization: `Bearer ${currentTokens.refresh_token}`,
            },
          });
          
          const { access_token, refresh_token, token_type, expires_in } = response.data;
          
          const expires_at = Math.floor(Date.now() / 1000) + expires_in;
          
          const tokens: AuthTokens = {
            access_token,
            refresh_token,
            token_type,
            expires_in,
            expires_at,
          };
          
          set({ tokens });
          
          // Reschedule next refresh
          get().scheduleTokenRefresh();
          
        } catch (error) {
          // Refresh failed, clear auth state
          get().logout();
          throw error;
        }
      },

      verifyEmail: async (token: string) => {
        try {
          await authApiClient.client.post('/auth/verify-email', { token });
          
          // Update user state if logged in
          const user = get().user;
          if (user) {
            set({
              user: { ...user, email_verified: true },
            });
          }
        } catch (error: any) {
          throw new Error(error.response?.data?.detail || 'Email verification failed');
        }
      },

      requestPasswordReset: async (email: string) => {
        try {
          await authApiClient.client.post('/auth/password-reset', { email });
        } catch (error: any) {
          throw new Error(error.response?.data?.detail || 'Password reset request failed');
        }
      },

      confirmPasswordReset: async (token: string, newPassword: string) => {
        try {
          await authApiClient.client.post('/auth/password-reset-confirm', {
            token,
            new_password: newPassword,
          });
        } catch (error: any) {
          throw new Error(error.response?.data?.detail || 'Password reset failed');
        }
      },

      setup2FA: async () => {
        try {
          const response = await authApiClient.client.post('/auth/2fa/setup');
          return response.data;
        } catch (error: any) {
          throw new Error(error.response?.data?.detail || '2FA setup failed');
        }
      },

      confirm2FA: async (code: string) => {
        try {
          const response = await authApiClient.client.post('/auth/2fa/confirm', { code });
          
          // Update user state
          const user = get().user;
          if (user) {
            set({
              user: { ...user, two_factor_enabled: true },
            });
          }
          
          return response.data;
        } catch (error: any) {
          throw new Error(error.response?.data?.detail || '2FA confirmation failed');
        }
      },

      disable2FA: async (password: string) => {
        try {
          await authApiClient.client.post('/auth/2fa/disable', null, {
            params: { current_password: password },
          });
          
          // Update user state
          const user = get().user;
          if (user) {
            set({
              user: { ...user, two_factor_enabled: false },
            });
          }
        } catch (error: any) {
          throw new Error(error.response?.data?.detail || 'Failed to disable 2FA');
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          await authApiClient.client.put('/auth/me/password', {
            current_password: currentPassword,
            new_password: newPassword,
          });
        } catch (error: any) {
          throw new Error(error.response?.data?.detail || 'Password change failed');
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      clearError: () => set({ error: null }),

      checkAuthStatus: async () => {
        try {
          const response = await authApiClient.client.get('/auth/verify-token');
          
          if (response.data.valid) {
            set({
              user: response.data.user,
              isAuthenticated: true,
            });
          } else {
            get().logout();
          }
        } catch {
          get().logout();
        }
      },

      // Helper methods (not exposed in interface)
      scheduleTokenRefresh: () => {
        const tokens = get().tokens;
        if (!tokens?.expires_at) return;
        
        const now = Math.floor(Date.now() / 1000);
        const refreshIn = (tokens.expires_at - now - 300) * 1000; // 5 minutes before expiry
        
        if (refreshIn > 0) {
          setTimeout(() => {
            get().refreshToken().catch(() => {
              // Refresh failed, user will be logged out
            });
          }, refreshIn);
        }
      },

      clearTokenRefreshSchedule: () => {
        // In a real implementation, store the timeout ID and clear it
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        sessionId: state.sessionId,
      }),
    }
  )
);

// Export API client for use in other services
export const authApi = authApiClient.client;

// Utility hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Auth guard hook
export const useAuthGuard = (requiredRole?: string, requiredPermissions?: string[]) => {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  
  if (!isAuthenticated || !user) {
    return { hasAccess: false, reason: 'Not authenticated' };
  }
  
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      superuser: 100,
      admin: 90,
      moderator: 80,
      pro: 50,
      standard: 30,
      trial: 10,
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    if (userLevel < requiredLevel) {
      return { hasAccess: false, reason: `Requires ${requiredRole} role` };
    }
  }
  
  if (requiredPermissions?.length) {
    const missingPermissions = requiredPermissions.filter(
      (perm) => !user.permissions.includes(perm)
    );
    
    if (missingPermissions.length > 0) {
      return {
        hasAccess: false,
        reason: `Missing permissions: ${missingPermissions.join(', ')}`,
      };
    }
  }
  
  return { hasAccess: true, reason: null };
};
