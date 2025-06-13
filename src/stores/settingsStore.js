import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // API Configuration
      apiKeys: {
        openai: '',
        gemini: '',
        lmstudio: '',
        anthropic: '',
        cohere: '',
      },
      

      
      // Model Settings
      modelSettings: {
        defaultProvider: 'offline',
        selectedModels: {
          openai: 'gpt-4',
          gemini: 'gemini-pro',
          lmstudio: 'local-model',
          offline: 'mock-model',
        },
        availableModels: {
          openai: ['gpt-4', 'gpt-3.5-turbo'],
          gemini: ['gemini-pro', 'gemini-pro-vision'],
          lmstudio: ['local-model'],
          offline: ['mock-model'],
        },
        temperature: 0.7,
        maxTokens: 2000,
      },
      
      // Application Settings
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
      
      // Export Settings
      export: {
        defaultFormat: 'mp4',
        defaultQuality: '1080p',
        defaultFrameRate: 30,
        includeWatermark: false,
        watermarkText: 'OpenClip Pro',
        outputDirectory: '',
      },
      
      // Performance Settings
      performance: {
        enableHardwareAcceleration: true,
        maxConcurrentProcessing: 2,
        cacheSize: 1024,
        previewQuality: 'medium',
        enablePreloading: true,
      },
      
      // Actions - work offline
      loadSettings: () => {
        // Settings are automatically loaded by persist middleware
      },
      
      updateApiKey: async (provider, key) => {
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
        }))
      },
      
      updateModelSetting: async (key, value) => {
        set((state) => ({
          modelSettings: {
            ...state.modelSettings,
            [key]: value,
          },
        }))
      },
      
      updateSelectedModel: (provider, model) => {
        set((state) => ({
          modelSettings: {
            ...state.modelSettings,
            selectedModels: {
              ...state.modelSettings.selectedModels,
              [provider]: model,
            },
          },
        }))
      },
      
      setAvailableModels: (provider, models) => {
        set((state) => ({
          modelSettings: {
            ...state.modelSettings,
            availableModels: {
              ...state.modelSettings.availableModels,
              [provider]: models,
            },
          },
        }))
      },
      
      updateAppSetting: async (key, value) => {
        set((state) => ({
          app: {
            ...state.app,
            [key]: value,
          },
        }))
      },
      
      updateExportSetting: (key, value) => {
        set((state) => ({
          export: {
            ...state.export,
            [key]: value,
          },
        }))
      },
      
      updatePerformanceSetting: (key, value) => {
        set((state) => ({
          performance: {
            ...state.performance,
            [key]: value,
          },
        }))
      },
      
      // Validation
      validateApiKey: (provider, key) => {
        if (!key || key.trim() === '') return false
        
        switch (provider) {
          case 'openai':
            return key.startsWith('sk-') && key.length > 20
          case 'gemini':
            return key.length > 10
          case 'lmstudio':
            return true
          case 'offline':
            return true
          default:
            return false
        }
      },
      
      // Mock API functions
      fetchAvailableModels: async (provider) => {
        // Return pre-defined models
        const models = get().modelSettings.availableModels[provider] || []
        return models
      },
      
      testApiConnection: async (provider) => {
        // Always succeed in offline mode
        return { success: true, message: 'Offline mode - no API connection needed' }
      },
      

      
      // Initialize - works offline
      initialize: async () => {
        return true
      },
      
      loadProviders: async () => {
        // Return offline providers
        return ['offline', 'openai', 'gemini', 'lmstudio']
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
            defaultProvider: 'offline',
            selectedModels: {
              openai: 'gpt-4',
              gemini: 'gemini-pro',
              lmstudio: 'local-model',
              offline: 'mock-model',
            },
            availableModels: {
              openai: ['gpt-4', 'gpt-3.5-turbo'],
              gemini: ['gemini-pro', 'gemini-pro-vision'],
              lmstudio: ['local-model'],
              offline: ['mock-model'],
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
        })
      },
      
      // Export/Import settings
      exportSettings: () => {
        const state = get()
        const exportData = {
          modelSettings: state.modelSettings,
          app: state.app,
          export: state.export,
          performance: state.performance,
        }
        return JSON.stringify(exportData, null, 2)
      },
      
      importSettings: (settingsJson) => {
        try {
          const settings = JSON.parse(settingsJson)
          set((state) => ({
            ...state,
            ...settings,
          }))
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        }
      },
      
      setApiKey: async (provider, key) => {
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
        }))
        return { success: true }
      },
    }),
    {
      name: 'openclip-settings',
      partialize: (state) => ({
        modelSettings: state.modelSettings,
        app: state.app,
        export: state.export,
        performance: state.performance,
      }),
    }
  )
)

export { useSettingsStore }
