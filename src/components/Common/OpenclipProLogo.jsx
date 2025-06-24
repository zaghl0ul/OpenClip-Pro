import React, { useRef, useEffect, useState } from 'react';

// Utility to generate smooth vortex lines
function generateVortexPath(cx, cy, rStart, rEnd, angleStart, angleEnd, turns, offset = 0, noise = 0, tAnim = 0) {
  const points = [];
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Animate the angle and radius for undulation
    const anim = Math.sin(t * Math.PI * 2 + offset + tAnim) * noise * 0.7;
    const angle = angleStart + (angleEnd - angleStart) * t + turns * 2 * Math.PI * t + offset + anim * 0.04;
    const radius = rStart + (rEnd - rStart) * t + Math.sin(angle * 2 + offset + tAnim) * noise + anim;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
  }
  return points.join(' ');
}

// Utility to generate random star positions
function generateStars(cx, cy, width, height, count, tAnim = 0) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = Math.pow(Math.random(), 1.5) * (Math.min(width, height) * 0.48);
    const x = cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 10;
    const y = cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 10;
    const r = Math.random() * 1.2 + 0.3 + Math.sin(tAnim + i) * 0.2;
    // Twinkle by animating opacity
    const o = 0.5 + 0.5 * Math.abs(Math.sin(tAnim * 0.8 + i));
    stars.push({ x, y, r, o });
  }
  return stars;
}

const OpenclipProLogo = ({
  width = 600,
  height = 600,
  className = '',
  mainColor = '#4fd1ff',
  bgColor = '#0a101a',
  lineColor = '#3ec6ff',
  textColor = '#6ed6ff',
  starColor = '#b3e6ff',
  lineCount = 18,
  starCount = 60
}) => {
  const [tAnim, setTAnim] = useState(0);
  const requestRef = useRef();

  useEffect(() => {
    let running = true;
    const animate = () => {
      setTAnim(t => t + 0.018);
      if (running) requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const cx = width / 2;
  const cy = height / 2;
  // Animated vortex lines
  const lines = Array.from({ length: lineCount }, (_, i) => {
    const t = i / (lineCount - 1);
    const rStart = width * (0.22 + t * 0.08);
    const rEnd = width * (0.38 + t * 0.13);
    const angleStart = Math.PI * (0.8 + t * 0.2);
    const angleEnd = Math.PI * (2.2 - t * 0.2);
    const turns = 1.1 + t * 0.2;
    const offset = t * 1.2;
    const noise = width * 0.01 + t * width * 0.01;
    return generateVortexPath(cx, cy, rStart, rEnd, angleStart, angleEnd, turns, offset, noise, tAnim * (0.7 + t * 0.5));
  });
  // Animated stars
  const stars = generateStars(cx, cy, width, height, starCount, tAnim);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{
        display: 'block',
        background: 'none',
        borderRadius: '16px',
        mixBlendMode: 'screen',
        filter: 'drop-shadow(0 0 32px #3ec6ff44) drop-shadow(0 0 64px #0a101a88)'
      }}
    >
      {/* Radial gradient for blending */}
      <defs>
        <radialGradient id="logoBg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0a101a" stopOpacity="0.7" />
          <stop offset="80%" stopColor="#0a101a" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0a101a" stopOpacity="0" />
        </radialGradient>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill="url(#logoBg)" />
      {/* Starfield */}
      <g>
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={starColor}
            opacity={s.o}
            style={{ filter: 'blur(0.2px)' }}
          />
        ))}
      </g>
      {/* Vortex lines */}
      <g filter="url(#glow)">
        {lines.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={lineColor}
            strokeWidth={1.2 + (i / lineCount) * 1.2}
            opacity={0.18 + 0.12 * (i / lineCount)}
            style={{ filter: 'blur(0.2px)' }}
          />
        ))}
      </g>
      {/* Text */}
      <g>
        <text
          x={cx}
          y={cy + width * 0.04}
          textAnchor="middle"
          fontFamily="'Inter', 'Montserrat', 'Segoe UI', Arial, sans-serif"
          fontWeight="400"
          fontSize={width * 0.11}
          fill={textColor}
          letterSpacing={1}
          style={{ filter: 'drop-shadow(0 2px 8px #3ec6ff33)' }}
        >
          openclip
        </text>
        <text
          x={cx + width * 0.11}
          y={cy + width * 0.13}
          textAnchor="end"
          fontFamily="'Inter', 'Montserrat', 'Segoe UI', Arial, sans-serif"
          fontWeight="400"
          fontSize={width * 0.055}
          fill={textColor}
          letterSpacing={1}
          style={{ filter: 'drop-shadow(0 2px 8px #3ec6ff33)' }}
        >
          pro
        </text>
      </g>
    </svg>
  );
};

export default OpenclipProLogo; 