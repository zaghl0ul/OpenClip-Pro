import React, { useState, useRef, useEffect } from 'react';

// Lightweight animation utilities to replace framer-motion
// This reduces bundle size from ~100KB to ~5KB

export const createAnimation = (keyframes, options = {}) => {
  const {
    duration = 300,
    easing = 'ease-out',
    delay = 0,
    fill = 'forwards'
  } = options;

  return {
    keyframes,
    options: {
      duration,
      easing,
      delay,
      fill
    }
  };
};

// Common animation presences
export const fadeIn = createAnimation(
  [{ opacity: 0 }, { opacity: 1 }],
  { duration: 200 }
);

export const fadeOut = createAnimation(
  [{ opacity: 1 }, { opacity: 0 }],
  { duration: 200 }
);

export const slideInUp = createAnimation(
  [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
  { duration: 300 }
);

export const slideInDown = createAnimation(
  [{ opacity: 0, transform: 'translateY(-20px)' }, { opacity: 1, transform: 'translateY(0)' }],
  { duration: 300 }
);

export const slideInLeft = createAnimation(
  [{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'translateX(0)' }],
  { duration: 300 }
);

export const slideInRight = createAnimation(
  [{ opacity: 0, transform: 'translateX(20px)' }, { opacity: 1, transform: 'translateX(0)' }],
  { duration: 300 }
);

export const scaleIn = createAnimation(
  [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'scale(1)' }],
  { duration: 300 }
);

export const scaleOut = createAnimation(
  [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.9)' }],
  { duration: 300 }
);

// Stagger animations for lists
export const staggerContainer = (staggerDelay = 0.1) => ({
  staggerChildren: staggerDelay
});

export const staggerItem = createAnimation(
  [{ opacity: 0, y: 20 }, { opacity: 1, y: 0 }],
  { duration: 300 }
);

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 }
};

export const hoverLift = {
  y: -2,
  transition: { duration: 0.2 }
};

// Loading animations
export const spin = createAnimation(
  [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
  { duration: 1000, easing: 'linear' }
);

export const pulse = createAnimation(
  [{ opacity: 0.5 }, { opacity: 1 }, { opacity: 0.5 }],
  { duration: 1500, easing: 'ease-in-out' }
);

// Utility to apply animation to element
export const animateElement = (element, animation) => {
  if (!element) return;
  
  return element.animate(animation.keyframes, animation.options);
};

// Utility to create CSS animation classes
export const createAnimationClass = (name, animation) => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ${name} {
      ${animation.keyframes.map((keyframe, index) => {
        const percentage = index === 0 ? '0%' : index === animation.keyframes.length - 1 ? '100%' : `${(index / (animation.keyframes.length - 1)) * 100}%`;
        const properties = Object.entries(keyframe).map(([prop, value]) => `${prop}: ${value}`).join('; ');
        return `${percentage} { ${properties} }`;
      }).join('\n      ')}
    }
    .animate-${name} {
      animation: ${name} ${animation.options.duration}ms ${animation.options.easing} ${animation.options.delay}ms ${animation.options.fill};
    }
  `;
  document.head.appendChild(style);
  return `animate-${name}`;
};

// Performance-optimized animation hook
export const useAnimation = (animation, deps = []) => {
  const elementRef = React.useRef(null);
  
  React.useEffect(() => {
    if (elementRef.current && animation) {
      const anim = animateElement(elementRef.current, animation);
      return () => anim?.cancel();
    }
  }, deps);
  
  return elementRef;
};

// Simple motion component replacement
export const Motion = ({ 
  children, 
  initial, 
  animate, 
  exit, 
  transition = {}, 
  className = '',
  style = {},
  ...props 
}) => {
  const elementRef = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    if (elementRef.current) {
      setIsVisible(true);
      
      if (initial && animate) {
        // Apply initial state
        Object.assign(elementRef.current.style, initial);
        
        // Animate to final state
        requestAnimationFrame(() => {
          if (elementRef.current) {
            Object.assign(elementRef.current.style, {
              transition: `all ${transition.duration || 300}ms ${transition.easing || 'ease-out'}`,
              ...animate
            });
          }
        });
      }
    }
  }, []);
  
  return React.cloneElement(children, {
    ref: elementRef,
    className,
    style: { ...style, ...(isVisible ? animate : initial) },
    ...props
  });
};

// AnimatePresence replacement
export const AnimatePresence = ({ children, mode = 'wait' }) => {
  const [isVisible, setIsVisible] = React.useState(true);
  
  React.useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);
  
  if (!isVisible) return null;
  return children;
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

// Advanced micro-interactions
export const microInteractions = {
  // Staggered fade-in animation
  staggerFadeIn: (delay = 100) => ({
    opacity: 0,
    transform: 'translateY(10px)',
    animation: `staggerFadeIn 0.6s ease-out ${delay}ms forwards`
  }),

  // Bounce entrance
  bounceIn: (delay = 0) => ({
    opacity: 0,
    transform: 'scale(0.8)',
    animation: `bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${delay}ms forwards`
  }),

  // Slide in from left
  slideInLeft: (delay = 0) => ({
    opacity: 0,
    transform: 'translateX(-20px)',
    animation: `slideInLeft 0.5s ease-out ${delay}ms forwards`
  }),

  // Slide in from right
  slideInRight: (delay = 0) => ({
    opacity: 0,
    transform: 'translateX(20px)',
    animation: `slideInRight 0.5s ease-out ${delay}ms forwards`
  }),

  // Scale in with rotation
  scaleRotateIn: (delay = 0) => ({
    opacity: 0,
    transform: 'scale(0.5) rotate(-10deg)',
    animation: `scaleRotateIn 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms forwards`
  }),

  // Floating animation
  float: (delay = 0) => ({
    animation: `float 3s ease-in-out ${delay}ms infinite`
  }),

  // Pulse with glow
  pulseGlow: (delay = 0) => ({
    animation: `pulseGlow 2s ease-in-out ${delay}ms infinite`
  }),

  // Shimmer effect
  shimmer: (delay = 0) => ({
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    backgroundSize: '200% 100%',
    animation: `shimmer 2s infinite ${delay}ms`
  }),

  // Typewriter effect
  typewriter: (text, delay = 0) => ({
    overflow: 'hidden',
    borderRight: '2px solid rgba(255,255,255,0.75)',
    whiteSpace: 'nowrap',
    animation: `typewriter ${text.length * 0.1}s steps(${text.length}) ${delay}ms forwards`
  }),

  // Morphing shape
  morph: (delay = 0) => ({
    animation: `morph 4s ease-in-out ${delay}ms infinite`
  }),

  // Ripple effect
  ripple: (delay = 0) => ({
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '0',
      height: '0',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.3)',
      transform: 'translate(-50%, -50%)',
      animation: `ripple 0.6s ease-out ${delay}ms`
    }
  })
};

// Enhanced hover effects
export const hoverEffects = {
  // Lift and glow
  liftGlow: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px) scale(1.02)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(59,130,246,0.3)'
    }
  },

  // Magnetic pull
  magnetic: {
    transition: 'transform 0.2s ease-out',
    '&:hover': {
      transform: 'scale(1.05)'
    }
  },

  // Border animation
  borderAnimate: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      border: '2px solid transparent',
      borderRadius: 'inherit',
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6) border-box',
      mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
      maskComposite: 'exclude',
      opacity: 0,
      transition: 'opacity 0.3s ease'
    },
    '&:hover::before': {
      opacity: 1
    }
  },

  // Text reveal
  textReveal: {
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: 'left 0.5s ease'
    },
    '&:hover::after': {
      left: '100%'
    }
  },

  // 3D tilt
  tilt3D: {
    transformStyle: 'preserve-3d',
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'perspective(1000px) rotateX(5deg) rotateY(5deg)'
    }
  }
};

// Performance-optimized animations
export const performanceAnimations = {
  // GPU-accelerated transform
  gpuTransform: (transform) => ({
    transform,
    willChange: 'transform',
    backfaceVisibility: 'hidden'
  }),

  // Optimized opacity
  fadeIn: {
    opacity: 0,
    animation: 'fadeIn 0.3s ease-out forwards',
    willChange: 'opacity'
  },

  // Smooth scroll behavior
  smoothScroll: {
    scrollBehavior: 'smooth',
    willChange: 'scroll-position'
  }
};

// CSS keyframes for advanced animations
export const keyframes = `
  @keyframes staggerFadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes bounceIn {
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slideInLeft {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scaleRotateIn {
    to {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulseGlow {
    0%, 100% { 
      box-shadow: 0 0 5px rgba(59,130,246,0.3);
    }
    50% { 
      box-shadow: 0 0 20px rgba(59,130,246,0.6);
    }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes typewriter {
    to { width: 100%; }
  }

  @keyframes morph {
    0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  }

  @keyframes ripple {
    to {
      width: '300px';
      height: '300px';
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    to { opacity: 1; }
  }
`;

// Utility function to apply staggered animations to children
export const applyStaggeredAnimation = (children, animation, baseDelay = 100) => {
  return React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        style: {
          ...child.props.style,
          ...animation(baseDelay * index)
        }
      });
    }
    return child;
  });
};

// Hook for intersection observer animations
export const useIntersectionAnimation = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (options.once) {
            observer.unobserve(entry.target);
          }
        } else if (!options.once) {
          setIsVisible(false);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [options]);

  return [elementRef, isVisible];
}; 