import React, { useState, useEffect, useRef } from 'react';

const AnimatedContainer = ({ 
  children, 
  animation = 'fadeIn',
  delay = 0,
  duration = 0.6,
  trigger = 'mount',
  className = '',
  stagger = false,
  staggerDelay = 100,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const elementRef = useRef(null);

  const animations = {
    fadeIn: {
      initial: { opacity: 0, transform: 'translateY(20px)' },
      animate: { opacity: 1, transform: 'translateY(0)' }
    },
    slideInLeft: {
      initial: { opacity: 0, transform: 'translateX(-30px)' },
      animate: { opacity: 1, transform: 'translateX(0)' }
    },
    slideInRight: {
      initial: { opacity: 0, transform: 'translateX(30px)' },
      animate: { opacity: 1, transform: 'translateX(0)' }
    },
    scaleIn: {
      initial: { opacity: 0, transform: 'scale(0.8)' },
      animate: { opacity: 1, transform: 'scale(1)' }
    },
    bounceIn: {
      initial: { opacity: 0, transform: 'scale(0.3)' },
      animate: { opacity: 1, transform: 'scale(1)' }
    },
    rotateIn: {
      initial: { opacity: 0, transform: 'rotate(-180deg) scale(0.5)' },
      animate: { opacity: 1, transform: 'rotate(0deg) scale(1)' }
    },
    flipIn: {
      initial: { opacity: 0, transform: 'perspective(400px) rotateY(90deg)' },
      animate: { opacity: 1, transform: 'perspective(400px) rotateY(0deg)' }
    },
    zoomIn: {
      initial: { opacity: 0, transform: 'scale(0.5)' },
      animate: { opacity: 1, transform: 'scale(1)' }
    },
    slideUp: {
      initial: { opacity: 0, transform: 'translateY(50px)' },
      animate: { opacity: 1, transform: 'translateY(0)' }
    },
    elasticIn: {
      initial: { opacity: 0, transform: 'scale(0.3)' },
      animate: { opacity: 1, transform: 'scale(1)' }
    },
    shimmer: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    }
  };

  const easingFunctions = {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  };

  const currentAnimation = animations[animation] || animations.fadeIn;
  const easing = animation === 'bounceIn' ? easingFunctions.bounce : 
                 animation === 'elasticIn' ? easingFunctions.elastic : 
                 easingFunctions.easeInOut;

  useEffect(() => {
    if (trigger === 'mount') {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, delay]);

  useEffect(() => {
    if (trigger === 'scroll' && elementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { 
          threshold: 0.1,
          rootMargin: '50px'
        }
      );

      observer.observe(elementRef.current);
      return () => observer.disconnect();
    }
  }, [trigger]);

  useEffect(() => {
    if (trigger === 'hover' && isTriggered) {
      setIsVisible(true);
    }
  }, [trigger, isTriggered]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsTriggered(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsTriggered(false);
      setIsVisible(false);
    }
  };

  const style = {
    transition: `all ${duration}s ${easing}`,
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    ...(isVisible ? currentAnimation.animate : currentAnimation.initial)
  };

  // Add shimmer effect for shimmer animation
  const shimmerStyle = animation === 'shimmer' && isVisible ? {
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    backgroundSize: '200% 100%',
    animation: `shimmer ${duration * 2}s infinite`
  } : {};

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ ...style, ...shimmerStyle }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedContainer; 