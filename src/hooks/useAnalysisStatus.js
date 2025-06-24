import { useState, useEffect, useCallback } from 'react';

const useAnalysisStatus = () => {
  const [analysisState, setAnalysisState] = useState({
    isAnalyzing: false,
    step: '',
    progress: 0,
    message: '',
    startTime: null,
    estimatedTime: null,
    currentProvider: null,
    framesExtracted: 0,
    totalFrames: 0,
  });

  const startAnalysis = useCallback((provider, prompt) => {
    setAnalysisState({
      isAnalyzing: true,
      step: 'initializing',
      progress: 0,
      message: 'Initializing AI analysis...',
      startTime: Date.now(),
      estimatedTime: 30000, // 30 seconds estimate
      currentProvider: provider,
      framesExtracted: 0,
      totalFrames: 12,
      prompt,
    });
  }, []);

  const updateProgress = useCallback((step, progress, message, extraData = {}) => {
    setAnalysisState((prev) => ({
      ...prev,
      step,
      progress: Math.min(progress, 100),
      message,
      ...extraData,
    }));
  }, []);

  const completeAnalysis = useCallback((success = true, message = '') => {
    setAnalysisState((prev) => ({
      ...prev,
      isAnalyzing: false,
      step: success ? 'completed' : 'error',
      progress: success ? 100 : prev.progress,
      message: message || (success ? 'Analysis completed successfully!' : 'Analysis failed'),
    }));
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysisState({
      isAnalyzing: false,
      step: '',
      progress: 0,
      message: '',
      startTime: null,
      estimatedTime: null,
      currentProvider: null,
      framesExtracted: 0,
      totalFrames: 0,
    });
  }, []);

  // Simulate realistic progress updates based on typical AI analysis steps
  useEffect(() => {
    if (!analysisState.isAnalyzing) return;

    let interval;
    const steps = [
      { step: 'extracting', progress: 20, message: 'Extracting video frames...', delay: 2000 },
      { step: 'preprocessing', progress: 40, message: 'Preprocessing images...', delay: 3000 },
      {
        step: 'analyzing',
        progress: 70,
        message: `Analyzing with ${analysisState.currentProvider}...`,
        delay: 15000,
      },
      { step: 'processing', progress: 90, message: 'Processing results...', delay: 3000 },
    ];

    let currentStepIndex = 0;

    const progressThroughSteps = () => {
      if (currentStepIndex < steps.length) {
        const currentStep = steps[currentStepIndex];
        updateProgress(currentStep.step, currentStep.progress, currentStep.message);

        setTimeout(() => {
          currentStepIndex++;
          progressThroughSteps();
        }, currentStep.delay);
      }
    };

    // Start the step progression after a short delay
    setTimeout(progressThroughSteps, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [analysisState.isAnalyzing, analysisState.currentProvider, updateProgress]);

  const getElapsedTime = useCallback(() => {
    if (!analysisState.startTime) return 0;
    return Math.floor((Date.now() - analysisState.startTime) / 1000);
  }, [analysisState.startTime]);

  const getRemainingTime = useCallback(() => {
    if (!analysisState.startTime || !analysisState.estimatedTime) return null;
    const elapsed = Date.now() - analysisState.startTime;
    const remaining = Math.max(0, analysisState.estimatedTime - elapsed);
    return Math.floor(remaining / 1000);
  }, [analysisState.startTime, analysisState.estimatedTime]);

  return {
    ...analysisState,
    startAnalysis,
    updateProgress,
    completeAnalysis,
    resetAnalysis,
    getElapsedTime,
    getRemainingTime,
  };
};

export default useAnalysisStatus;
