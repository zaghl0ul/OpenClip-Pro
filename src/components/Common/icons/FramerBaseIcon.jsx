import React from 'react';
import { motion } from 'framer-motion';

// Icon Component Wrapper - Foundation for all icons
export const Icon = ({ children, size = 24, color = "currentColor", className = "", ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon ${className}`}
    {...props}
  >
    {children}
  </svg>
);

// Animated Icon Wrapper with Framer Motion
export const AnimatedIcon = ({ children, animation = {}, ...props }) => (
  <motion.div
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    {...animation}
  >
    <Icon {...props}>{children}</Icon>
  </motion.div>
);

// Export animation presets for consistent behavior
export const animationPresets = {
  default: {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  },
  rotate: {
    animate: { rotate: 360 },
    transition: { duration: 1, repeat: Infinity, ease: "linear" }
  },
  pulse: {
    animate: { 
      scale: [1, 1.2, 1],
      opacity: [1, 0.8, 1]
    },
    transition: { duration: 2, repeat: Infinity }
  },
  draw: {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 0.5, ease: "easeInOut" }
  }
};
