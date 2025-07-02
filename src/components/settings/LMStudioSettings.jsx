import React, { useState, useEffect } from 'react';

import { useSettingsStore } from '../../stores/settingsStore';
import toast from 'react-hot-toast';
import { 
  TrendingUpIcon, SparklesIcon, BrainIcon, XIcon, VideoIcon, SettingsIcon, 
  LoaderIcon, ZapIcon, ActivityIcon, CheckCircleIcon, PlayIcon, EyeIcon,
  AlertTriangleIcon, XCircleIcon, RefreshCwIcon, ClockIcon, CheckIcon,
  AlertCircleIcon, LinkIcon, TrashIcon, PlusIcon, SearchIcon, Grid3X3Icon,
  ListIcon, ArrowRightIcon, ChevronRightIcon, UploadIcon, DownloadIcon,
  ShareIcon, FileTextIcon, MoreVerticalIcon, EditIcon, UserIcon, BellIcon,
  HelpCircleIcon, MenuIcon, FolderIcon, FilmIcon, TargetIcon, PaletteIcon,
  VolumeXIcon, Volume2Icon, SkipBackIcon, SkipForwardIcon, PauseIcon,
  MaximizeIcon, ScissorsIcon, LayersIcon, TrendingDownIcon, StarIcon,
  MailIcon, SendIcon, UsersIcon, MessageSquareIcon, HomeIcon, YoutubeIcon,
  BarChart2Icon, KeyIcon, ShieldIcon, ArrowLeftIcon
} from '../Common/icons';


const LMStudioSettings = () => {
  const { apiKeys, updateApiKey, testApiKey } = useSettingsStore();
  const [baseUrl, setBaseUrl] = useState('http://localhost:1234');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    // Load saved LM Studio URL
    const savedUrl = apiKeys.lmstudio;
    if (savedUrl) {
      setBaseUrl(savedUrl);
    }
  }, [apiKeys.lmstudio]);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      // Save the URL as the "API key" for LM Studio
      await updateApiKey('lmstudio', baseUrl);
      
      const result = await testApiKey('lmstudio', baseUrl);
      
      if (result.success) {
        setConnectionStatus('success');
        toast.success('LM Studio connection successful!');
        // Load available models after successful connection
        await loadAvailableModels();
      } else {
        setConnectionStatus('error');
        toast.error(result.message || 'LM Studio connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const loadAvailableModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch(`${baseUrl}/v1/models`);
      if (response.ok) {
        const data = await response.json();
        const models = data.data || [];
        setAvailableModels(models);
        
        if (models.length > 0 && !selectedModel) {
          setSelectedModel(models[0].id);
        }
      }
    } catch (error) {
      console.warn('Failed to load models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const getConnectionStatusIcon = () => {
    if (isTestingConnection) return <RefreshCwIcon size={16} className="w-4 h-4 animate-spin text-blue-400" />;
    
    switch (connectionStatus) {
      case 'success':
        return <CheckIcon size={16} className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XIcon size={16} className="w-4 h-4 text-red-400" />;
      default:
        return <SettingsIcon size={16} className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    if (isTestingConnection) return 'Testing connection...';
    
    switch (connectionStatus) {
      case 'success':
        return 'Connected';
      case 'error':
        return 'Connection failed';
      default:
        return 'Not tested';
    }
  };

  const getConnectionStatusColor = () => {
    if (isTestingConnection) return 'text-blue-400';
    
    switch (connectionStatus) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <SettingsIcon size={20} className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">LM Studio Configuration</h3>
          <p className="text-sm text-gray-400">Configure your local LM Studio server</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="glass-card p-4 border-l-4 border-purple-500">
        <div className="flex items-start gap-3">
          <AlertCircleIcon size={20} className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-white font-medium mb-1">Local AI with LM Studio</p>
            <p className="text-gray-400 mb-2">
              LM Studio runs AI models locally on your machine for privacy and cost control.
            </p>
            <a
              href="https://lmstudio.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
            >
              Download LM Studio <LinkIcon size={12} className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Server Configuration */}
      <div className="glass-card p-6">
        <h4 className="text-white font-medium mb-4">Server Configuration</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              LM Studio Server URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:1234"
                className="input flex-1"
              />
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection || !baseUrl}
                className="btn-secondary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingConnection ? 'Testing...' : 'Test'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Make sure LM Studio is running and the local server is started
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 p-3 glass-shine rounded-lg">
            {getConnectionStatusIcon()}
            <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </span>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      {connectionStatus === 'success' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Available Models</h4>
            <button
              onClick={loadAvailableModels}
              disabled={isLoadingModels}
              className="btn-ghost text-sm p-2"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingModels ? (
            <div className="flex items-center gap-2 text-gray-400">
              <LoaderIcon size={16} className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading models...</span>
            </div>
          ) : availableModels.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Found {availableModels.length} model{availableModels.length > 1 ? 's' : ''}:
              </p>
              <div className="space-y-2">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedModel === model.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{model.id}</p>
                        {model.object && (
                          <p className="text-xs text-gray-400">{model.object}</p>
                        )}
                      </div>
                      {selectedModel === model.id && (
                        <CheckIcon size={20} className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircleIcon size={32} className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                No models loaded in LM Studio.
                <br />
                Please load a model in LM Studio and try again.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Usage Tips */}
      <div className="glass-card p-4">
        <h4 className="text-white font-medium mb-3">Setup Instructions</h4>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-start gap-2">
            <span size={20} className="flex-shrink-0 w-5 h-5 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center justify-center font-medium">1</span>
            <span>Download and install LM Studio from lmstudio.ai</span>
          </div>
          <div className="flex items-start gap-2">
            <span size={20} className="flex-shrink-0 w-5 h-5 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center justify-center font-medium">2</span>
            <span>Download a model (e.g., Llama 2, Mistral, etc.)</span>
          </div>
          <div className="flex items-start gap-2">
            <span size={20} className="flex-shrink-0 w-5 h-5 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center justify-center font-medium">3</span>
            <span>Start the local server in LM Studio</span>
          </div>
          <div className="flex items-start gap-2">
            <span size={20} className="flex-shrink-0 w-5 h-5 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center justify-center font-medium">4</span>
            <span>Test the connection above</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LMStudioSettings; 