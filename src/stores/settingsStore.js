import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../utils/apiClient';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // API Keys
      apiKeys: {
        openai: '',
        gemini: '',
        lmstudio: '',
        anthropic: '',
        cohere: '',
      },

      // Model Settings
      modelSettings: {
        defaultProvider: 'openai',
        selectedModels: {
          openai: 'gpt-4-vision-preview',
          gemini: 'gemini-pro-vision',
          lmstudio: 'local-model',
          anthropic: 'claude-3-opus-20240229',
        },
        availableModels: {
          openai: [],
          gemini: [],
          lmstudio: [],
          anthropic: [],
        },
        temperature: 0.7,
        maxTokens: 2000,
      },

      // App Settings
      app: {
        theme: 'dark',
        language: 'en',
        autoSave: true,
        autoSaveInterval: 30,
        maxProjectHistory: 50,
        defaultVideoQuality: 'high',
        enableAnalytics: false,
        enableNotifications: true,
      },

      // Performance Settings
      performance: {
        hardwareAcceleration: true,
        cacheEnabled: true,
        maxConcurrentExports: 3,
        videoPreviewQuality: 'medium',
        enableGPUAcceleration: false,
      },

      // Security Settings
      security: {
        encryptApiKeys: true,
        autoLockTimeout: 30,
        requirePassphrase: false,
        enableAuditLog: true,
      },

      // Export Settings
      export: {
        defaultFormat: 'mp4',
        defaultQuality: '1080p',
        defaultFrameRate: 30,
        includeWatermark: false,
      },

      // Loading states
      isLoading: false,
      error: null,

      // Actions
      updateApiKey: async (provider, key) => {
        // Update local state
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
        }));

        // Save to backend if key is not empty
        if (key && key.trim()) {
          try {
            const result = await apiClient.saveApiKey(provider, key);
            console.log(`✅ API key for ${provider} saved to backend:`, result.message);
          } catch (error) {
            console.error(`❌ Failed to save ${provider} API key to backend:`, error);
            // Continue with local storage for now
            // Don't show user error since local storage still works
          }
        }
      },

      updateModelSetting: (key, value) => {
        set((state) => ({
          modelSettings: {
            ...state.modelSettings,
            [key]: value,
          },
        }));
      },

      updateAppSetting: (key, value) => {
        set((state) => ({
          app: {
            ...state.app,
            [key]: value,
          },
        }));
      },

      updatePerformanceSetting: (key, value) => {
        set((state) => ({
          performance: {
            ...state.performance,
            [key]: value,
          },
        }));
      },

      updateSecuritySetting: (key, value) => {
        set((state) => ({
          security: {
            ...state.security,
            [key]: value,
          },
        }));
      },

      updateExportSetting: (key, value) => {
        set((state) => ({
          export: {
            ...state.export,
            [key]: value,
          },
        }));
      },

      // Real API functions
      fetchAvailableModels: async (provider) => {
        const { apiKeys } = get();
        const apiKey = apiKeys[provider];

        if (!apiKey) {
          throw new Error(`No API key configured for ${provider}`);
        }

        try {
          set({ isLoading: true, error: null });

          const models = await apiClient.getProviderModels(provider, apiKey);

          set((state) => ({
            modelSettings: {
              ...state.modelSettings,
              availableModels: {
                ...state.modelSettings.availableModels,
                [provider]: models,
              },
            },
            isLoading: false,
          }));

          return models;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      testApiConnection: async (provider) => {
        const { apiKeys } = get();
        const apiKey = apiKeys[provider];

        if (!apiKey) {
          return { success: false, message: `No API key configured for ${provider}` };
        }

        try {
          set({ isLoading: true, error: null });

          const result = await apiClient.testApiKey(provider, apiKey);

          set({ isLoading: false });
          return result;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, message: error.message };
        }
      },

      // Save settings to backend
      saveSettings: async () => {
        try {
          set({ isLoading: true, error: null });

          const { apiKeys, modelSettings, app, performance, security } = get();

          await apiClient.saveUserSettings({
            api_keys: apiKeys,
            model_settings: modelSettings,
            app_settings: app,
            performance_settings: performance,
            security_settings: security,
          });

          set({ isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Load settings from backend
      loadSettings: async () => {
        try {
          set({ isLoading: true, error: null });

          const settings = await apiClient.getUserSettings();

          // Handle API key status from backend
          const apiKeyStatus = {};
          if (settings.api_keys) {
            Object.keys(settings.api_keys).forEach((key) => {
              if (key.endsWith('_configured')) {
                const provider = key.replace('_configured', '');
                // Don't override existing keys, just note they're configured
                apiKeyStatus[provider] = settings.api_keys[key] ? '***configured***' : '';
              }
            });
          }

          set({
            apiKeys: { ...get().apiKeys, ...apiKeyStatus },
            modelSettings: { ...get().modelSettings, ...settings.model_settings },
            app: { ...get().app, ...settings.app_settings },
            performance: { ...get().performance, ...settings.performance_settings },
            security: { ...get().security, ...settings.security_settings },
            isLoading: false,
          });

          return settings;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Initialize - load settings from backend
      initialize: async () => {
        try {
          await get().loadSettings();
          return true;
        } catch (error) {
          console.warn('Failed to load settings from backend:', error.message);
          // Continue with local settings
          return false;
        }
      },

      loadProviders: async () => {
        try {
          const providers = await apiClient.getProviders();
          return providers;
        } catch (error) {
          console.warn('Failed to load providers:', error.message);
          // Return default providers
          return ['openai', 'gemini', 'lmstudio', 'anthropic'];
        }
      },

      // Reset settings
      resetSettings: () => {
        set({
          apiKeys: {
            openai: '',
            gemini: '',
            lmstudio: '',
            anthropic: '',
            cohere: '',
          },
          modelSettings: {
            defaultProvider: 'openai',
            selectedModels: {
              openai: 'gpt-4-vision-preview',
              gemini: 'gemini-pro-vision',
              lmstudio: 'local-model',
              anthropic: 'claude-3-opus-20240229',
            },
            availableModels: {
              openai: [],
              gemini: [],
              lmstudio: [],
              anthropic: [],
            },
            temperature: 0.7,
            maxTokens: 2000,
          },
          app: {
            theme: 'dark',
            language: 'en',
            autoSave: true,
            autoSaveInterval: 30,
            maxProjectHistory: 50,
            defaultVideoQuality: 'high',
            enableAnalytics: false,
            enableNotifications: true,
          },
          performance: {
            hardwareAcceleration: true,
            cacheEnabled: true,
            maxConcurrentExports: 3,
            videoPreviewQuality: 'medium',
            enableGPUAcceleration: false,
          },
          security: {
            encryptApiKeys: true,
            autoLockTimeout: 30,
            requirePassphrase: false,
            enableAuditLog: true,
          },
          export: {
            defaultFormat: 'mp4',
            defaultQuality: '1080p',
            defaultFrameRate: 30,
            includeWatermark: false,
          },
          error: null,
        });
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'openclip-settings',
      // Only persist certain settings locally, not API keys for security
      partialize: (state) => ({
        modelSettings: {
          defaultProvider: state.modelSettings.defaultProvider,
          selectedModels: state.modelSettings.selectedModels,
          temperature: state.modelSettings.temperature,
          maxTokens: state.modelSettings.maxTokens,
        },
        app: state.app,
        performance: state.performance,
        security: {
          ...state.security,
          // Don't persist sensitive security settings
          encryptApiKeys: true,
          requirePassphrase: false,
        },
        export: state.export,
      }),
    }
  )
);

export { useSettingsStore };
