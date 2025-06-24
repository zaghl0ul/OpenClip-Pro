import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Eye,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

const AnalysisStatusPanel = ({
  isAnalyzing,
  step,
  progress,
  message,
  currentProvider,
  getElapsedTime,
  getRemainingTime,
  onCancel,
  onRetry,
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    if (step === 'completed') return <CheckCircle className="w-6 h-6 text-green-400" />;
    if (step === 'error') return <XCircle className="w-6 h-6 text-red-400" />;
    if (isAnalyzing) return <Loader className="w-6 h-6 text-blue-400 animate-spin" />;
    return <Brain className="w-6 h-6 text-purple-400" />;
  };

  const getStatusColor = () => {
    if (step === 'completed') return 'border-green-500/30 bg-green-500/10';
    if (step === 'error') return 'border-red-500/30 bg-red-500/10';
    if (isAnalyzing) return 'border-blue-500/30 bg-blue-500/10';
    return 'border-white/20 bg-white/5';
  };

  const getStepDetails = (currentStep) => {
    const steps = {
      initializing: { icon: Brain, color: 'text-purple-400', label: 'Initializing' },
      extracting: { icon: Eye, color: 'text-cyan-400', label: 'Extracting Frames' },
      preprocessing: { icon: Zap, color: 'text-yellow-400', label: 'Preprocessing' },
      analyzing: { icon: Brain, color: 'text-blue-400', label: 'AI Analysis' },
      processing: { icon: Zap, color: 'text-green-400', label: 'Processing Results' },
      completed: { icon: CheckCircle, color: 'text-green-400', label: 'Completed' },
      error: { icon: XCircle, color: 'text-red-400', label: 'Error' },
    };
    return steps[currentStep] || steps.initializing;
  };

  if (!isAnalyzing && step !== 'completed' && step !== 'error') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`glass-prism rounded-2xl p-6 border ${getStatusColor()} backdrop-blur-xl`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {step === 'completed'
                    ? 'Analysis Complete'
                    : step === 'error'
                      ? 'Analysis Failed'
                      : 'AI Video Analysis'}
                </h3>
                <p className="text-white/60 text-sm">
                  {currentProvider &&
                    `Using ${currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)}`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {step === 'error' && onRetry && (
                <button
                  onClick={onRetry}
                  className="glass-shine px-3 py-2 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
              )}
              {isAnalyzing && onCancel && (
                <button
                  onClick={onCancel}
                  className="glass-shine px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(isAnalyzing || step === 'completed') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">{message}</span>
                <span className="text-white/60">{Math.round(progress)}%</span>
              </div>

              <div className="relative">
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </motion.div>
                </div>

                {/* Progress glow effect */}
                <div
                  className="absolute top-0 left-0 h-3 bg-blue-400/30 rounded-full blur-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Step Indicators */}
          {isAnalyzing && (
            <div className="flex items-center justify-between">
              {['initializing', 'extracting', 'preprocessing', 'analyzing', 'processing'].map(
                (stepName, index) => {
                  const stepInfo = getStepDetails(stepName);
                  const Icon = stepInfo.icon;
                  const isActive = step === stepName;
                  const isCompleted =
                    [
                      'initializing',
                      'extracting',
                      'preprocessing',
                      'analyzing',
                      'processing',
                    ].indexOf(step) > index;

                  return (
                    <div key={stepName} className="flex flex-col items-center gap-2">
                      <div
                        className={`relative p-2 rounded-full border-2 transition-all duration-300 ${
                          isActive
                            ? `border-blue-500 bg-blue-500/20`
                            : isCompleted
                              ? `border-green-500 bg-green-500/20`
                              : `border-white/20 bg-white/5`
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 transition-colors duration-300 ${
                            isActive
                              ? 'text-blue-400'
                              : isCompleted
                                ? 'text-green-400'
                                : 'text-white/40'
                          }`}
                        />

                        {/* Pulse animation for active step */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-75" />
                        )}
                      </div>

                      <span
                        className={`text-xs font-medium transition-colors duration-300 ${
                          isActive
                            ? 'text-blue-400'
                            : isCompleted
                              ? 'text-green-400'
                              : 'text-white/40'
                        }`}
                      >
                        {stepInfo.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* Time Information */}
          {(isAnalyzing || step === 'completed') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-shine rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white/60">Elapsed</span>
                </div>
                <p className="text-white font-mono">{formatTime(getElapsedTime())}</p>
              </div>

              {isAnalyzing && getRemainingTime() && (
                <div className="glass-shine rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-white/60" />
                    <span className="text-sm text-white/60">Remaining</span>
                  </div>
                  <p className="text-white font-mono">~{formatTime(getRemainingTime())}</p>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {step === 'completed' && (
            <div className="glass-shine rounded-lg p-4 bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">Analysis Successful!</p>
                  <p className="text-white/60 text-sm">
                    Your video has been analyzed and clips have been generated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {step === 'error' && (
            <div className="glass-shine rounded-lg p-4 bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-medium">Analysis Failed</p>
                  <p className="text-white/60 text-sm">{message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnalysisStatusPanel;
