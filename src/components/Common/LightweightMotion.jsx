import React, { useRef, useEffect, useState } from 'react';

// Lightweight motion components to replace framer-motion
// Reduces bundle size significantly while maintaining smooth animations

export const MotionDiv = ({ 
  children, 
  initial = {}, 
  animate = {}, 
  exit = {}, 
  transition = {},
  className = '',
  style = {},
  whileHover = {},
  whileTap = {},
  onAnimationComplete,
  ...props 
}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (elementRef.current) {
      // Apply initial state
      Object.assign(elementRef.current.style, initial);
      
      // Animate to final state
      requestAnimationFrame(() => {
        if (elementRef.current) {
          const duration = transition.duration || 300;
          const easing = transition.easing || 'ease-out';
          
          Object.assign(elementRef.current.style, {
            transition: `all ${duration}ms ${easing}`,
            ...animate
          });
          
          // Call completion callback
          setTimeout(() => {
            onAnimationComplete?.();
          }, duration);
        }
      });
    }
  }, [animate, initial, onAnimationComplete, transition.duration, transition.easing]);

  const handleMouseEnter = () => {
    if (whileHover && elementRef.current) {
      setIsHovered(true);
      Object.assign(elementRef.current.style, whileHover);
    }
  };

  const handleMouseLeave = () => {
    if (whileHover && elementRef.current) {
      setIsHovered(false);
      Object.assign(elementRef.current.style, animate);
    }
  };

  const handleMouseDown = () => {
    if (whileTap && elementRef.current) {
      setIsPressed(true);
      Object.assign(elementRef.current.style, whileTap);
    }
  };

  const handleMouseUp = () => {
    if (whileTap && elementRef.current) {
      setIsPressed(false);
      Object.assign(elementRef.current.style, isHovered ? whileHover : animate);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={elementRef}
      className={className}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
    </div>
  );
};

export const MotionButton = ({ 
  children, 
  initial = {}, 
  animate = {}, 
  transition = {},
  className = '',
  style = {},
  whileHover = {},
  whileTap = {},
  ...props 
}) => {
  return (
    <MotionDiv
      as="button"
      initial={initial}
      animate={animate}
      transition={transition}
      className={className}
      style={style}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export const MotionSpan = ({ 
  children, 
  initial = {}, 
  animate = {}, 
  transition = {},
  className = '',
  style = {},
  ...props 
}) => {
  return (
    <MotionDiv
      as="span"
      initial={initial}
      animate={animate}
      transition={transition}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export const AnimatePresence = ({ children, mode = 'wait' }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);
  
  if (!isVisible) return null;
  return children;
};

// Stagger animation container
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1, 
  className = '',
  ...props 
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={className} {...props}>
      {childrenArray.map((child, index) => (
        <MotionDiv
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 300, 
            delay: index * staggerDelay * 1000 
          }}
        >
          {child}
        </MotionDiv>
      ))}
    </div>
  );
};

// Fade in animation
export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '',
  ...props 
}) => {
  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

// Slide in animations
export const SlideInUp = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '',
  ...props 
}) => {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export const SlideInDown = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '',
  ...props 
}) => {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export const SlideInLeft = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '',
  ...props 
}) => {
  return (
    <MotionDiv
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export const SlideInRight = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '',
  ...props 
}) => {
  return (
    <MotionDiv
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

// Scale animations
export const ScaleIn = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '',
  ...props 
}) => {
  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

// Loading spinner
export const Spinner = ({ 
  size = 'w-6 h-6', 
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`${size} ${className} border-2 border-white border-t-transparent rounded-full animate-spin`}
      {...props}
    />
  );
};

// Pulse animation
export const Pulse = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`${className} animate-pulse`}
      {...props}
    >
      {children}
    </div>
  );
};

// Spring animation replacement
export const useSpring = (value, config = {}) => {
  const [springValue, setSpringValue] = React.useState(value);
  
  React.useEffect(() => {
    const stiffness = config.stiffness || 400;
    const damping = config.damping || 40;
    
    const animate = () => {
      setSpringValue(prev => {
        const diff = value - prev;
        const velocity = diff * (stiffness / 1000);
        const newValue = prev + velocity * (1 - damping / 1000);
        
        if (Math.abs(diff) > 0.01) {
          requestAnimationFrame(animate);
        }
        
        return newValue;
      });
    };
    
    requestAnimationFrame(animate);
  }, [value, config.stiffness, config.damping]);
  
  return springValue;
};

// Transform utility
export const useTransform = (value, inputRange, outputRange) => {
  const [transformedValue, setTransformedValue] = React.useState(outputRange[0]);
  
  React.useEffect(() => {
    const inputMin = inputRange[0];
    const inputMax = inputRange[1];
    const outputMin = outputRange[0];
    const outputMax = outputRange[1];
    
    const progress = (value - inputMin) / (inputMax - inputMin);
    const result = outputMin + (outputMax - outputMin) * progress;
    
    setTransformedValue(result);
  }, [value, inputRange, outputRange]);
  
  return transformedValue;
}; 