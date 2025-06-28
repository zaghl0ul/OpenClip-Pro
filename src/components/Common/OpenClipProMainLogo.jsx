import React from 'react';
import { motion } from 'framer-motion';

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
    <motion.svg
      viewBox="0 0 200 200"
      className={`${sizeClasses[size]} ${className}`}
      initial={animate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
      animate={animate ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
      transition={animate ? { duration: 0.8, ease: "easeOut" } : {}}
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
      <motion.circle
        cx="100" cy="100" r="95"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        opacity="0.3"
        initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
        animate={animate ? { pathLength: 1 } : { pathLength: 1 }}
        transition={animate ? { duration: 1.5, delay: 0.2 } : {}}
      />
      
      {/* C Letter - Left curve */}
      <motion.path
        d="M 45 100 
           A 45 45 0 0 1 100 55
           A 45 45 0 0 1 145 85
           L 135 95
           A 35 35 0 0 0 100 65
           A 35 35 0 0 0 55 100
           A 35 35 0 0 0 100 135
           A 35 35 0 0 0 135 105
           L 145 115
           A 45 45 0 0 1 100 145
           A 45 45 0 0 1 45 100"
        fill="url(#logoGradient)"
        filter="url(#glow)"
        initial={animate ? { opacity: 0, pathLength: 0 } : { opacity: 1, pathLength: 1 }}
        animate={animate ? { opacity: 1, pathLength: 1 } : { opacity: 1, pathLength: 1 }}
        transition={animate ? { duration: 1, delay: 0.4 } : {}}
      />
      
      {/* P Letter - Right side */}
      <motion.path
        d="M 110 55
           L 110 145
           L 120 145
           L 120 105
           L 140 105
           A 25 25 0 0 0 140 55
           L 110 55
           Z
           M 120 65
           L 130 65
           A 15 15 0 0 1 130 95
           L 120 95
           Z"
        fill="url(#logoGradient)"
        filter="url(#glow)"
        initial={animate ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
        animate={animate ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
        transition={animate ? { duration: 0.8, delay: 0.6 } : {}}
      />
      
      {/* Concentric accent lines for depth */}
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.circle
          key={i}
          cx="100" cy="100" 
          r={85 - i * 5}
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="0.5"
          opacity={0.1 + i * 0.05}
          initial={animate ? { scale: 0.5, opacity: 0 } : { scale: 1, opacity: 0.1 + i * 0.05 }}
          animate={animate ? { scale: 1, opacity: 0.1 + i * 0.05 } : { scale: 1, opacity: 0.1 + i * 0.05 }}
          transition={animate ? { duration: 0.6, delay: 0.8 + i * 0.1 } : {}}
        />
      ))}
    </motion.svg>
  );

  return (
    <div className="flex items-center space-x-3">
      <motion.div
        whileHover={animate ? { 
          scale: 1.05,
          rotate: 5,
          filter: "drop-shadow(0 0 20px rgba(88, 166, 255, 0.4))"
        } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <LogoSVG />
      </motion.div>
      
      {showText && (
        <motion.div
          initial={animate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
          animate={animate ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
          transition={animate ? { duration: 0.6, delay: 1 } : {}}
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

export default OpenClipProMainLogo; 