import React, { memo, useMemo, useCallback } from 'react';

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

// CSS animation classes for better performance
const createAnimationClass = (pattern, opacity, animate) => {
  if (!animate) return '';
  
  const baseClass = `animate-pattern-${pattern}`;
  return `${baseClass} opacity-${Math.floor(opacity * 100)}`;
};

// Simplified pattern generators with CSS animations
const PatternGenerators = {
  dots: (svgSize, actualColor, opacity, animate) => {
    // Reduced from 6x6 (36 elements) to 4x4 (16 elements) for better performance
    const gridSize = 4;
    const spacing = (svgSize - 40) / (gridSize - 1);

    return [...Array(gridSize)]
      .map((_, row) =>
        [...Array(gridSize)].map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={20 + col * spacing}
            cy={20 + row * spacing}
            r="2"
            fill={actualColor}
            opacity={opacity}
            className={animate ? `animate-pattern-dot delay-${(row + col) * 50}` : ''}
          />
        ))
      )
      .flat();
  },

  grid: (svgSize, actualColor, opacity, animate) => {
    const gridSize = 6;
    const spacing = (svgSize - 40) / (gridSize - 1);

    return [...Array(gridSize)]
      .map((_, row) =>
        [...Array(gridSize)].map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={20 + col * spacing - 1}
            y={20 + row * spacing - 1}
            width="2"
            height="2"
            fill={actualColor}
            opacity={opacity}
            className={animate ? `animate-pattern-grid delay-${(row + col) * 30}` : ''}
          />
        ))
      )
      .flat();
  },

  lines: (svgSize, actualColor, opacity, animate) => {
    const lineCount = 8;
    const spacing = svgSize / (lineCount + 1);

    return [...Array(lineCount)].map((_, i) => (
      <line
        key={i}
        x1={spacing * (i + 1)}
        y1="20"
        x2={spacing * (i + 1)}
        y2={svgSize - 20}
        stroke={actualColor}
        strokeWidth="1"
        opacity={opacity}
        className={animate ? `animate-pattern-line delay-${i * 100}` : ''}
      />
    ));
  },

  circles: (svgSize, actualColor, opacity, animate) => {
    const circleCount = 5;
    const maxRadius = svgSize / 4;
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;

    return [...Array(circleCount)].map((_, i) => {
      const radius = (maxRadius * (i + 1)) / circleCount;
      return (
        <circle
          key={i}
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={actualColor}
          strokeWidth="1"
          opacity={opacity}
          className={animate ? `animate-pattern-circle delay-${i * 150}` : ''}
        />
      );
    });
  },

  triangles: (svgSize, actualColor, opacity, animate) => {
    const triangleCount = 6;
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const maxSize = svgSize / 3;

    return [...Array(triangleCount)].map((_, i) => {
      const size = (maxSize * (i + 1)) / triangleCount;
      const angle = (i * 60 * Math.PI) / 180;
      const x1 = centerX + size * Math.cos(angle);
      const y1 = centerY + size * Math.sin(angle);
      const x2 = centerX + size * Math.cos(angle + (2 * Math.PI) / 3);
      const y2 = centerY + size * Math.sin(angle + (2 * Math.PI) / 3);
      const x3 = centerX + size * Math.cos(angle + (4 * Math.PI) / 3);
      const y3 = centerY + size * Math.sin(angle + (4 * Math.PI) / 3);

      return (
        <polygon
          key={i}
          points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
          fill="none"
          stroke={actualColor}
          strokeWidth="1"
          opacity={opacity}
          className={animate ? `animate-pattern-triangle delay-${i * 120}` : ''}
        />
      );
    });
  },
};

const GeometricPattern = memo(({
  pattern = 'dots',
  size = 'medium',
  color = 'primary',
  opacity = 0.3,
  animate = true,
  className = '',
  performanceMode = 'auto'
}) => {
  const svgSize = useMemo(() => SIZE_MAP[size] || SIZE_MAP.medium, [size]);
  const actualColor = useMemo(() => COLOR_MAP[color] || COLOR_MAP.primary, [color]);
  
  // Performance mode detection
  const shouldAnimate = useMemo(() => {
    if (performanceMode === 'low') return false;
    if (performanceMode === 'high') return animate;
    
    // Auto mode: check device capabilities
    const isLowEndDevice = navigator.hardwareConcurrency <= 4 || 
                          navigator.deviceMemory <= 4;
    return animate && !isLowEndDevice;
  }, [animate, performanceMode]);

  const patternElements = useMemo(() => {
    const generator = PatternGenerators[pattern];
    if (!generator) {
      console.warn(`Unknown pattern: ${pattern}`);
      return PatternGenerators.dots(svgSize, actualColor, opacity, shouldAnimate);
    }
    return generator(svgSize, actualColor, opacity, shouldAnimate);
  }, [pattern, svgSize, actualColor, opacity, shouldAnimate]);

  const animationClass = useMemo(() => 
    createAnimationClass(pattern, opacity, shouldAnimate), 
    [pattern, opacity, shouldAnimate]
  );

  return (
    <div className={`relative pointer-events-none ${className}`}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className={`w-full h-full ${animationClass}`}
        style={{ opacity }}
      >
        {patternElements}
      </svg>
    </div>
  );
});

GeometricPattern.displayName = 'GeometricPattern';

export default GeometricPattern;
