import React, { useState } from 'react'
import { CheckIcon, RefreshCwIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../../stores/settingsStore'
import Win98ProgressBar from '../Common/Win98ProgressBar'
import { getCurrentTheme } from '../../config/themes'

const ApiSettings = () => {
  const {
    apiKeys,
    modelSettings,
    updateApiKey,
    updateModelSetting,
    fetchAvailableModels,
    testApiConnection
  } = useSettingsStore()
  
  const [showApiKeys, setShowApiKeys] = useState({})
  const [testingConnection, setTestingConnection] = useState({})
  const [loadingModels, setLoadingModels] = useState({})
  const [showWin98Progress, setShowWin98Progress] = useState(false)
  const [showWin98ModelsProgress, setShowWin98ModelsProgress] = useState(false)
  const [currentTestingProvider, setCurrentTestingProvider] = useState('')
  const [currentModelProvider, setCurrentModelProvider] = useState('')
  
  const isRetroTheme = getCurrentTheme() === 'retro'
  
  // Handle case where store is not yet hydrated
  if (!apiKeys || !modelSettings) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-600 rounded"></div>
            <div className="h-10 bg-gray-600 rounded"></div>
            <div className="h-10 bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    )
  }
  
  const handleTestConnection = async (provider) => {
    setTestingConnection(prev => ({ ...prev, [provider]: true }))
    
    // Show Win98 progress bar in retro theme
    if (isRetroTheme) {
      setCurrentTestingProvider(provider)
      setShowWin98Progress(true)
    }
    
    try {
      const result = await testApiConnection(provider)
      
      // Wait for progress bar to complete in retro theme
      if (isRetroTheme) {
        // The progress bar will handle the completion
        return
      }
      
      if (result.success) {
        toast.success(`${provider} connection successful`)
      } else {
        toast.error(`${provider} connection failed: ${result.message}`)
      }
    } catch (error) {
      if (!isRetroTheme) {
        toast.error(`Connection test failed: ${error.message}`)
      }
    } finally {
      if (!isRetroTheme) {
        setTestingConnection(prev => ({ ...prev, [provider]: false }))
      }
    }
  }
  
  const handleProgressComplete = async () => {
    setShowWin98Progress(false)
    
    try {
      const result = await testApiConnection(currentTestingProvider)
      if (result.success) {
        toast.success(`${currentTestingProvider} connection successful`)
      } else {
        toast.error(`${currentTestingProvider} connection failed: ${result.message}`)
      }
    } catch (error) {
      toast.error(`Connection test failed: ${error.message}`)
    } finally {
      setTestingConnection(prev => ({ ...prev, [currentTestingProvider]: false }))
      setCurrentTestingProvider('')
    }
  }
  
  const handleFetchModels = async (provider) => {
    setLoadingModels(prev => ({ ...prev, [provider]: true }))
    
    // Show Win98 progress bar in retro theme
    if (isRetroTheme) {
      setCurrentModelProvider(provider)
      setShowWin98ModelsProgress(true)
      return
    }
    
    try {
      await fetchAvailableModels(provider)
      toast.success(`Models loaded for ${provider}`)
    } catch (error) {
      toast.error(`Failed to load models: ${error.message}`)
    } finally {
      setLoadingModels(prev => ({ ...prev, [provider]: false }))
    }
  }
  
  const handleModelsProgressComplete = async () => {
    setShowWin98ModelsProgress(false)
    
    try {
      await fetchAvailableModels(currentModelProvider)
      toast.success(`Models loaded for ${currentModelProvider}`)
    } catch (error) {
      toast.error(`Failed to load models: ${error.message}`)
    } finally {
      setLoadingModels(prev => ({ ...prev, [currentModelProvider]: false }))
      setCurrentModelProvider('')
    }
  }
  
  return (
    <>
      {/* Windows 98 Progress Bar for API Testing */}
      <Win98ProgressBar
        isVisible={showWin98Progress}
        title="API Connection Test"
        status={`Testing ${currentTestingProvider} connection...`}
        onComplete={handleProgressComplete}
        duration={2500}
      />
      
      {/* Windows 98 Progress Bar for Model Fetching */}
      <Win98ProgressBar
        isVisible={showWin98ModelsProgress}
        title="Loading Models"
        status={`Fetching available models from ${currentModelProvider}...`}
        onComplete={handleModelsProgressComplete}
        duration={3000}
      />
      
      <div className="space-y-6">
      {/* API Keys */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          API Keys
        </h3>
        <div className="space-y-4">
          {Object.entries(apiKeys || {}).map(([provider, key]) => (
            <div key={provider} className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 capitalize">
                {provider} API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKeys[provider] ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => updateApiKey(provider, e.target.value)}
                    placeholder={`Enter ${provider} API key`}
                    className="input pr-10"
                  />
                  <button
                    onClick={() => setShowApiKeys(prev => ({
                      ...prev,
                      [provider]: !prev[provider]
                    }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showApiKeys[provider] ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => handleTestConnection(provider)}
                  disabled={!key || testingConnection[provider]}
                  className="btn btn-secondary btn-sm"
                >
                  {testingConnection[provider] ? (
                    <div className="spinner w-4 h-4" />
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleFetchModels(provider)}
                  disabled={!key || loadingModels[provider]}
                  className="btn btn-secondary btn-sm"
                >
                  {loadingModels[provider] ? (
                    <div className="spinner w-4 h-4" />
                  ) : (
                    <RefreshCwIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Model Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Model Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default Provider
            </label>
            <select
              value={modelSettings?.defaultProvider || 'openai'}
              onChange={(e) => updateModelSetting('defaultProvider', e.target.value)}
              className="input"
            >
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="lmstudio">LM Studio</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Temperature
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={modelSettings?.temperature || 0.7}
              onChange={(e) => updateModelSetting('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-400 mt-1">
              {modelSettings?.temperature || 0.7} (Creativity)
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              value={modelSettings?.maxTokens || 2000}
              onChange={(e) => updateModelSetting('maxTokens', parseInt(e.target.value))}
              className="input"
              min="100"
              max="128000"
            />
          </div>
        </div>
        
        {/* Model Selection for Each Provider */}
        <div className="mt-6 space-y-4">
          <h4 className="text-md font-medium text-gray-200 mb-3">
            Model Selection
          </h4>
          {Object.keys(apiKeys || {}).map(provider => {
            const availableModels = modelSettings?.availableModels?.[provider] || []
            const selectedModel = modelSettings?.selectedModels?.[provider]
            
            return (
              <div key={provider} className="flex items-center gap-4">
                <div className="w-24">
                  <span className="text-sm font-medium text-gray-300 capitalize">
                    {provider}
                  </span>
                </div>
                <div className="flex-1">
                  <select
                    value={selectedModel}
                    onChange={(e) => updateModelSetting('selectedModels', {
                      ...modelSettings?.selectedModels,
                      [provider]: e.target.value
                    })}
                    className="input"
                    disabled={availableModels.length === 0}
                  >
                    {availableModels.length === 0 ? (
                      <option value="">No models available - fetch models first</option>
                    ) : (
                      availableModels.map((model, index) => (
                        <option key={`${provider}-${model.id || index}`} value={model.id}>
                          {model.name} - {model.description}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {availableModels.length > 0 && (
                  <div className="text-xs text-gray-400">
                    {availableModels.find(m => m.id === selectedModel)?.max_tokens || 'N/A'} tokens
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </>
  )
}

export default ApiSettings