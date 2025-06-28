import React from 'react';
import { motion } from 'framer-motion';

const OpenClipProImageLogo = ({ 
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

  return (
    <div className="flex items-center space-x-3">
      <motion.div
        className={`${sizeClasses[size]} ${className} relative`}
        initial={animate ? { opacity: 0, scale: 0.8, rotate: -10 } : { opacity: 1, scale: 1, rotate: 0 }}
        animate={animate ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 1, scale: 1, rotate: 0 }}
        transition={animate ? { duration: 1, ease: "easeOut" } : {}}
        whileHover={animate ? { 
          scale: 1.05,
          rotate: 5,
          filter: "drop-shadow(0 0 25px rgba(88, 166, 255, 0.6))"
        } : {}}
      >
        {/* Fallback to SVG if image not available */}
        <img 
          src="/openclip-logo-main.png" 
          alt="OpenClip Pro Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to inline SVG if image fails
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        
        {/* Fallback SVG */}
        <div 
          className="w-full h-full absolute top-0 left-0 hidden"
          style={{ display: 'none' }}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="fallbackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#58A6FF" />
                <stop offset="50%" stopColor="#7C6AFF" />
                <stop offset="100%" stopColor="#FF6B9D" />
              </linearGradient>
            </defs>
            
            {/* Simplified CP design */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="url(#fallbackGradient)" strokeWidth="8" opacity="0.3"/>
            <text x="100" y="120" textAnchor="middle" fill="url(#fallbackGradient)" fontSize="80" fontWeight="bold" fontFamily="Arial, sans-serif">
              CP
            </text>
          </svg>
        </div>
      </motion.div>
      
      {showText && (
        <motion.div
          initial={animate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
          transition={animate ? { duration: 0.6, delay: 0.8 } : {}}
          className="flex flex-col"
        >
          <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent`}>
            OpenClip
          </span>
          <span className={`${textSizeClasses[size]} font-bold text-accent opacity-80 -mt-1`}>
            Pro
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default OpenClipProImageLogo; 