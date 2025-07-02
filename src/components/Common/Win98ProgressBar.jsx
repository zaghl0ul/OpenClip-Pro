import React, { useState, useEffect } from 'react';

const Win98ProgressBar = ({
  isVisible = false,
  title = 'Progress',
  status = 'Working...',
  onComplete = null,
  duration = 3000, // Default 3 seconds
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible && !isAnimating) {
      setIsAnimating(true);
      setCurrentProgress(0);

      // Simulate realistic progress steps
      const steps = title.includes('Loading')
        ? [
            { progress: 20, status: 'Connecting to API...' },
            { progress: 45, status: 'Authenticating...' },
            { progress: 70, status: 'Fetching model list...' },
            { progress: 90, status: 'Processing models...' },
            { progress: 100, status: 'Complete!' },
          ]
        : [
            { progress: 15, status: 'Initializing connection...' },
            { progress: 35, status: 'Authenticating API key...' },
            { progress: 60, status: 'Validating permissions...' },
            { progress: 85, status: 'Testing endpoint...' },
            { progress: 100, status: 'Connection verified!' },
          ];

      let stepIndex = 0;
      const interval = setInterval(() => {
        if (stepIndex < steps.length) {
          const step = steps[stepIndex];
          setCurrentProgress(step.progress);
          setCurrentStatus(step.status);
          stepIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setIsAnimating(false);
            if (onComplete) onComplete();
          }, 500);
        }
      }, duration / steps.length);

      return () => clearInterval(interval);
    }
  }, [isVisible, duration, onComplete, isAnimating, title]);

  if (!isVisible) return null;

  return (
    <div className="win98-progress-overlay">
      <div className="win98-progress-dialog">
        {/* Title Bar */}
        <div className="win98-progress-titlebar">
          <span className="win98-progress-title">{title}</span>
        </div>

        {/* Content */}
        <div className="win98-progress-content">
          <div className="win98-progress-status">{currentStatus}</div>

          {/* Progress Bar Container */}
          <div className="win98-progress-container">
            <div className="win98-progress-bar">
              <div className="win98-progress-fill" style={{ width: `${currentProgress}%` }} />
              {/* Classic Windows 98 progress bar segments */}
              <div className="win98-progress-segments">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className={`win98-progress-segment ${
                      (i + 1) * 5 <= currentProgress ? 'active' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Percentage */}
          <div className="win98-progress-percentage">{Math.round(currentProgress)}%</div>
        </div>
      </div>
    </div>
  );
};

export default Win98ProgressBar;
