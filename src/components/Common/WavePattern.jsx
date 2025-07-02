import React from 'react';

const WavePattern = ({ 
  className = '', 
  opacity = 0.1, 
  animate = true, 
  color = 'primary',
  size = 'large',
  variant = 'default'
}) => {
  const sizeClasses = {
    small: 'w-64 h-32',
    medium: 'w-96 h-48',
    large: 'w-[600px] h-[300px]',
    xlarge: 'w-[800px] h-[400px]',
    fullscreen: 'w-[120vw] h-[120vh]'
  };

  // CSS animation classes instead of framer-motion
  const animationClasses = {
    default: animate ? 'animate-wave-default' : '',
    slow: animate ? 'animate-wave-slow' : '',
    gentle: animate ? 'animate-wave-gentle' : ''
  };

  const uniqueId = `wave-${color}-${Date.now()}-${Math.random()}`;

  return (
    <div 
      className={`absolute pointer-events-none ${sizeClasses[size]} ${className} ${animationClasses[variant]}`}
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 600 300"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.6" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Simplified wave path - reduced complexity for performance */}
        <path
          d="M0,150 Q150,100 300,150 T600,150 L600,300 L0,300 Z"
          fill={`url(#gradient-${uniqueId})`}
          className="transition-all duration-1000"
        />
      </svg>
    </div>
  );
};

export default WavePattern; 