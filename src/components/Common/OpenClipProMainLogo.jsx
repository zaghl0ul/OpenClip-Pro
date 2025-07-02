import React from 'react';

const OpenClipProMainLogo = ({ 
  size = 'large', 
  animate = true, 
  className = '',
  showText = true 
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24', 
    large: 'w-32 h-32',
    xlarge: 'w-48 h-48',
    hero: 'w-64 h-64'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
    xlarge: 'text-3xl',
    hero: 'text-4xl'
  };

  // Stylized CP logo using SVG to match the uploaded design
  const LogoSVG = () => (
    <div
      className={`${sizeClasses[size]} ${className}`}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#58A6FF" />
          <stop offset="50%" stopColor="#7C6AFF" />
          <stop offset="100%" stopColor="#FF6B9D" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(to bottom, rgba(88, 166, 255, 0.3), rgba(124, 106, 255, 0.3))",
          filter: "drop-shadow(0 0 20px rgba(88, 166, 255, 0.4))"
        }}
      ></div>
      
      {/* C Letter - Left curve */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(to right, #58A6FF, #7C6AFF)",
          filter: "url(#glow)",
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          transform: "rotate(45deg)",
          transformOrigin: "bottom right"
        }}
      ></div>
      
      {/* P Letter - Right side */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(to right, #58A6FF, #7C6AFF)",
          filter: "url(#glow)",
          clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)",
          transform: "rotate(45deg)",
          transformOrigin: "top left"
        }}
      ></div>
      
      {/* Concentric accent lines for depth */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to bottom, rgba(88, 166, 255, 0.1), rgba(124, 106, 255, 0.1))",
            filter: "url(#glow)",
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            transform: `rotate(${i * 72}deg) scale(${0.5 + i * 0.05})`,
            transformOrigin: "50% 100%"
          }}
        ></div>
      ))}
    </div>
  );

  return (
    <div className="flex items-center space-x-3">
      <div
        className="flex items-center justify-center"
      >
        <LogoSVG />
      </div>
      
      {showText && (
        <div
          className="flex flex-col"
        >
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent`}>
            OpenClip
          </span>
          <span className={`${textSizeClasses[size]} font-bold text-accent opacity-80 -mt-1`}>
            Pro
          </span>
        </div>
      )}
    </div>
  );
};

export default OpenClipProMainLogo; 