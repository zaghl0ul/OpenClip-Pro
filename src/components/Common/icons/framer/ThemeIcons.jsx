import React from 'react';
import { motion } from 'framer-motion';
import { Icon, AnimatedIcon } from '../FramerBaseIcon';

// Theme Icons with smooth transitions
export const SunIcon = (props) => (
  <AnimatedIcon {...props}>
    <motion.g
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.3 }}
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </motion.g>
  </AnimatedIcon>
);

export const MoonIcon = (props) => (
  <AnimatedIcon {...props}>
    <motion.path 
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      initial={{ scale: 0, rotate: 90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.3 }}
    />
  </AnimatedIcon>
);
