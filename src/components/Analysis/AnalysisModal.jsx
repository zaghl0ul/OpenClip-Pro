import React, { useState } from 'react';
import AnalysisPrompt from './AnalysisPrompt';
import VideoPlayer from '../Video/VideoPlayer';
import { 
  TrendingUpIcon, 
  SparklesIcon, 
  BrainIcon, 
  XIcon, 
  VideoIcon, 
  SettingsIcon, 
  LoaderIcon, 
  ZapIcon 
} from '../Common/icons';

const AnalysisModal = React.memo(({ isOpen, onClose, onStartAnalysis, defaultPrompt = '', videoUrl, projectId, projectTitle }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [analysisType, setAnalysisType] = useState('key-moments');
  const [intensity, setIntensity] = useState('medium');
  const [clipDuration, setClipDuration] = useState(15);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');

  const analysisTypes = [
    {
      value: 'key-moments',
      label: 'Key Moments',
      description: 'Identify important scenes and highlights',
      icon: TrendingUpIcon
    },
    {
      value: 'viral-clips',
      label: 'Viral Clips',
      description: 'Generate shareable social media clips',
      icon: TrendingUpIcon
    },
    {
      value: 'creative',
      label: 'Creative Analysis',
      description: 'Artistic and creative interpretations',
      icon: SparklesIcon
    }
  ];

  if (!isOpen) return null;

  const handleStartAnalysis = async () => {
    const promptText = customPrompt.trim() || defaultPrompt.trim();
    
    if (!promptText) {
      setError('Please provide an analysis prompt');
      return;
    }

    if (!onStartAnalysis || typeof onStartAnalysis !== 'function') {
      setError('Analysis function not available. Please try again.');
      console.error('onStartAnalysis is not a function:', onStartAnalysis);
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      await onStartAnalysis({
        prompt: promptText,
        type: analysisType,
        intensity,
        clipDuration,
        autoGenerate,
        provider: 'openai'
      });
      // Success is handled by parent component (modal close)
    } catch (err) {
      setError(`Analysis failed: ${err.message || 'Unknown error'}`);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Enhanced Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden glass-prism rounded-2xl">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg">
              <BrainIcon size={24} className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Video Analysis</h2>
              <p className="text-white/60 text-sm">Generate insights and clips from your video</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="glass-button p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close analysis modal"
          >
            <XIcon size={20} className="w-5 h-5 text-white/70 hover:text-white transition-colors" />
          </button>
        </div>

        {/* Enhanced Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Enhanced Video Preview */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <VideoIcon size={20} className="w-5 h-5 text-blue-400" />
              Video Preview
            </h3>
            <div className="aspect-video rounded-lg overflow-hidden">
              <VideoPlayer
                videoUrl={videoUrl}
                projectId={projectId}
                className="w-full h-full"
                title={projectTitle}
              />
            </div>
          </div>

          {/* Enhanced Analysis Options */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <SettingsIcon size={20} className="w-5 h-5 text-purple-400" />
              Analysis Options
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enhanced Analysis Type Selection */}
              <div className="space-y-3">
                <label className="text-white/80 text-sm font-medium">Analysis Type</label>
                <div className="space-y-2">
                  {analysisTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAnalysisType(type.value)}
                      className={`glass-button w-full p-4 rounded-lg text-left transition-all duration-200 ${
                        analysisType === type.value
                          ? 'bg-indigo-500/20 border-indigo-500/50 scale-[1.02]'
                          : 'bg-white/5 hover:bg-white/10 hover:scale-[1.01]'
                      }`}
                      aria-label={`Select ${type.label} analysis`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          analysisType === type.value
                            ? 'bg-indigo-500/30'
                            : 'bg-white/10'
                        }`}>
                          <type.icon className={`w-5 h-5 ${
                            analysisType === type.value
                              ? 'text-indigo-300'
                              : 'text-white/60'
                          }`} />
                        </div>
                        <div>
                          <h4 className={`font-medium ${
                            analysisType === type.value
                              ? 'text-white'
                              : 'text-white/80'
                          }`}>
                            {type.label}
                          </h4>
                          <p className={`text-sm ${
                            analysisType === type.value
                              ? 'text-white/70'
                              : 'text-white/50'
                          }`}>
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Settings Panel */}
              <div className="space-y-4">
                <label className="text-white/80 text-sm font-medium">Settings</label>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-white/60 text-sm">Analysis Intensity</label>
                    <select
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value)}
                      className="glass-button w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-500/50 transition-colors"
                    >
                      <option value="subtle">Subtle</option>
                      <option value="medium">Medium</option>
                      <option value="vivid">Vivid</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm">Clip Duration (seconds)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={clipDuration}
                      onChange={(e) => setClipDuration(parseInt(e.target.value))}
                      className="glass-button w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoGenerate"
                      checked={autoGenerate}
                      onChange={(e) => setAutoGenerate(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
                    />
                    <label htmlFor="autoGenerate" className="text-white/60 text-sm">
                      Auto-generate clips after analysis
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Custom Prompt */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <SparklesIcon size={20} className="w-5 h-5 text-green-400" />
              Custom Analysis Prompt
            </h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what you want to analyze or the type of clips you want to generate..."
              className="glass-button w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-indigo-500/50 transition-colors resize-none"
              rows={4}
              aria-label="Custom analysis prompt"
            />
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
          <div className="text-white/60 text-sm">
            Analysis will take 2-5 minutes depending on video length
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="glass-button px-6 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className={`glass-button px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                isAnalyzing
                  ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 hover:scale-105'
              }`}
              aria-label={isAnalyzing ? 'Analysis in progress' : 'Start analysis'}
            >
              {isAnalyzing ? (
                <>
                  <LoaderIcon size={16} className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ZapIcon size={16} className="w-4 h-4" />
                  Start Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

AnalysisModal.displayName = 'AnalysisModal';

export default AnalysisModal;