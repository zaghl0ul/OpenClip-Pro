import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

// Static objects moved outside to prevent recreation
const SIZE_MAP = {
  small: 120,
  medium: 200,
  large: 300,
};

const COLOR_MAP = {
  primary: '#3B82F6',
  accent: '#06B6D4',
  secondary: '#8B5CF6',
};

// Optimized animation variants to reduce re-calculations
const createAnimationVariant = (opacity, animate) => {
  if (!animate) return {};

  return {
    opacity: [opacity * 0.4, opacity, opacity * 0.4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };
};

// Simplified pattern generators
const PatternGenerators = {
  dots: (svgSize, actualColor, opacity, animate) => {
    // Reduced from 6x6 (36 elements) to 4x4 (16 elements) for better performance
    const gridSize = 4;
    const spacing = (svgSize - 40) / (gridSize - 1);

    return [...Array(gridSize)]
      .map((_, row) =>
        [...Array(gridSize)].map((_, col) => (
          <motion.circle
            key={`${row}-${col}`}
            cx={20 + col * spacing}
            cy={20 + row * spacing}
            r="2"
            fill={actualColor}
            opacity={opacity}
            animate={animate ? createAnimationVariant(opacity, animate) : {}}
            transition={{
              duration: 3,
              repeat: animate ? Infinity : 0,
              ease: 'easeInOut',
              delay: (row + col) * 0.2,
            }}
          />
        ))
      )
      .flat();
  },

  lines: (svgSize, actualColor, opacity, animate) => {
    // Reduced from 8 to 5 lines
    return [...Array(5)].map((_, i) => (
      <motion.line
        key={i}
        x1={i % 2 === 0 ? 20 : 40}
        y1={30 + i * 30}
        x2={i % 2 === 0 ? svgSize - 20 : svgSize - 40}
        y2={30 + i * 30}
        stroke={actualColor}
        strokeWidth="1.5"
        opacity={opacity}
        strokeDasharray="6 12"
        animate={
          animate
            ? {
                opacity: [opacity * 0.5, opacity, opacity * 0.5],
                strokeDashoffset: [0, -18, 0],
              }
            : {}
        }
        transition={{
          duration: 5,
          repeat: animate ? Infinity : 0,
          ease: 'linear',
          delay: i * 0.3,
        }}
      />
    ));
  },

  grid: (svgSize, actualColor, opacity, animate) => {
    const lines = [];
    const spacing = 40;
    const count = Math.floor(svgSize / spacing) - 1;

    // Vertical lines (reduced count)
    for (let i = 1; i <= count; i++) {
      lines.push(
        <motion.line
          key={`v-${i}`}
          x1={i * spacing}
          y1={20}
          x2={i * spacing}
          y2={svgSize - 20}
          stroke={actualColor}
          strokeWidth="0.8"
          opacity={opacity}
          animate={animate ? createAnimationVariant(opacity, animate) : {}}
          transition={{
            duration: 6,
            repeat: animate ? Infinity : 0,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      );
    }

    // Horizontal lines (reduced count)
    for (let i = 1; i <= count; i++) {
      lines.push(
        <motion.line
          key={`h-${i}`}
          x1={20}
          y1={i * spacing}
          x2={svgSize - 20}
          y2={i * spacing}
          stroke={actualColor}
          strokeWidth="0.8"
          opacity={opacity}
          animate={animate ? createAnimationVariant(opacity, animate) : {}}
          transition={{
            duration: 6,
            repeat: animate ? Infinity : 0,
            ease: 'easeInOut',
            delay: 1 + i * 0.2,
          }}
        />
      );
    }

    return lines;
  },

  simple: (svgSize, actualColor, opacity) => {
    // Ultra-simple pattern for low-performance devices
    return [
      <circle
        key="center"
        cx={svgSize / 2}
        cy={svgSize / 2}
        r="3"
        fill={actualColor}
        opacity={opacity}
      />,
      <circle
        key="ring"
        cx={svgSize / 2}
        cy={svgSize / 2}
        r="20"
        fill="none"
        stroke={actualColor}
        strokeWidth="1"
        opacity={opacity * 0.6}
      />,
    ];
  },
};

const GeometricPattern = memo(
  ({
    variant = 'dots',
    size = 'medium',
    opacity = 0.3,
    animate = true,
    className = '',
    color = 'primary',
    performanceMode = false, // New prop for performance control
  }) => {
    const svgSize = SIZE_MAP[size];
    const actualColor = COLOR_MAP[color] || COLOR_MAP.primary;

    // Use simple pattern in performance mode
    const effectiveVariant = performanceMode ? 'simple' : variant;
    const effectiveAnimate = performanceMode ? false : animate;

    // Memoize pattern generation with all dependencies
    const patternElements = useMemo(() => {
      const generator = PatternGenerators[effectiveVariant] || PatternGenerators.simple;
      return generator(svgSize, actualColor, opacity, effectiveAnimate);
    }, [effectiveVariant, svgSize, actualColor, opacity, effectiveAnimate]);

    // Memoize container styles
    const containerStyle = useMemo(
      () => ({
        width: svgSize,
        height: svgSize,
        minWidth: svgSize,
        minHeight: svgSize,
      }),
      [svgSize]
    );

    return (
      <div className={`pointer-events-none ${className}`} style={containerStyle}>
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full h-full"
          style={{
            overflow: 'visible',
            isolation: 'isolate', // Create stacking context
          }}
        >
          {patternElements}
        </svg>
      </div>
    );
  }
);

GeometricPattern.displayName = 'GeometricPattern';

export default GeometricPattern;
