import React from 'react';
import { motion } from 'framer-motion';

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

  // Simplified animation variants for better performance
  const animationVariants = {
    default: {
      animate: {
        x: [0, 20, 0],
        y: [0, -10, 0],
      },
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    slow: {
      animate: {
        x: [0, -15, 0],
        y: [0, 8, 0],
      },
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    gentle: {
      animate: {
        x: [0, 12, 0],
        y: [0, -6, 0],
      },
      transition: {
        duration: 16,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const animationProps = animate ? animationVariants[variant] || animationVariants.default : {};

  const uniqueId = `wave-${color}-${Date.now()}-${Math.random()}`;

  return (
    <motion.div 
      className={`absolute pointer-events-none ${sizeClasses[size]} ${className}`}
      style={{ opacity }}
      {...animationProps}
    >

      
      <svg
        viewBox="0 0 2400 1200"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={`waveGradient1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-gradientStart)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-gradientEnd)" stopOpacity="0.08" />
          </linearGradient>
          
          <linearGradient id={`waveGradient2-${uniqueId}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--color-gradientEnd)" stopOpacity="0.06" />
          </linearGradient>

          <linearGradient id={`waveGradient3-${uniqueId}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-gradientEnd)" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Simplified wave layers for better performance */}
        <path
          d="M0,800 C400,700 800,900 1200,760 C1600,620 2000,840 2400,720 L2400,1200 L0,1200 Z"
          fill={`url(#waveGradient1-${uniqueId})`}
          opacity="0.8"
        />
        
        <path
          d="M0,860 C500,760 900,960 1400,820 C1900,680 2300,900 2400,780 L2400,1200 L0,1200 Z"
          fill={`url(#waveGradient2-${uniqueId})`}
          opacity="0.6"
        />
        
        <path
          d="M0,920 C600,840 1000,1000 1600,880 C2000,760 2200,960 2400,840 L2400,1200 L0,1200 Z"
          fill={`url(#waveGradient3-${uniqueId})`}
          opacity="0.4"
        />
        
        {/* Simplified top coverage waves */}
        <path
          d="M0,0 L2400,0 L2400,300 C2000,250 1600,350 1200,280 C800,210 400,320 0,260 Z"
          fill={`url(#waveGradient1-${uniqueId})`}
          opacity="0.3"
        />
        
        <path
          d="M0,0 L2400,0 L2400,200 C1900,150 1500,250 1100,180 C700,110 300,220 0,160 Z"
          fill={`url(#waveGradient2-${uniqueId})`}
          opacity="0.2"
        />
      </svg>
    </motion.div>
  );
};

export default WavePattern; 