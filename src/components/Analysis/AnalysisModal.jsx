import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Settings, Check, Info } from 'lucide-react';
import AnalysisPrompt from './AnalysisPrompt';

const AnalysisModal = ({ isOpen, onClose, onStartAnalysis, defaultPrompt = '' }) => {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [provider, setProvider] = useState('openai');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStartAnalysis = async (promptText) => {
    if (!promptText?.trim()) {
      setError('Please provide an analysis prompt');
      return;
    }

    setPrompt(promptText);
    setIsAnalyzing(true);
    setError('');

    try {
      await onStartAnalysis({
        prompt: promptText,
        provider,
      });
      // Success is handled by parent component (modal close)
    } catch (err) {
      setError(`Analysis failed: ${err.message || 'Unknown error'}`);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const providers = [
    { id: 'openai', name: 'OpenAI', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
    { id: 'gemini', name: 'Google Gemini', logo: 'https://seeklogo.com/images/G/google-gemini-logo-4F05CA3DB1-seeklogo.com.png' },
    { id: 'anthropic', name: 'Anthropic Claude', logo: 'https://seeklogo.com/images/A/anthropic-logo-1146A0624A-seeklogo.com.png' },
    { id: 'local', name: 'Local LLM', logo: 'https://cdn-icons-png.flaticon.com/512/2285/2285551.png' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-prism rounded-2xl shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
            AI Video Analysis
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AnalysisPrompt
                onAnalyze={handleStartAnalysis}
                isAnalyzing={isAnalyzing}
                initialPrompt={defaultPrompt}
              />
            </div>
            
            <div className="space-y-6">
              {/* Provider Selection */}
              <div className="glass-shine rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 text-white/60" />
                  <h4 className="font-medium text-white">
                    AI Provider
                  </h4>
                </div>
                
                <div className="space-y-2">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
                        provider === p.id
                          ? 'bg-green-500/20 border border-green-500/50'
                          : 'hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        {provider === p.id ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <img src={p.logo} alt={p.name} className="w-5 h-5 object-contain" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        provider === p.id 
                          ? 'text-green-300' 
                          : 'text-white/80'
                      }`}>
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Settings & Info */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/70">
                    <p className="mb-2">
                      The AI will analyze your video and identify key moments based on your prompt.
                    </p>
                    <p>
                      For best results, be specific about what you're looking for in your video.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalysisModal; 