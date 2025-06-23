import React from 'react';
import { Play } from 'lucide-react';

const LogoDisplay = ({ 
  width = 800, 
  height = 600, 
  className = '',
  primaryColor = '#0088cc',
  secondaryColor = '#00aaff',
  accentColor = '#00ffff',
  particleCount = 400,
  animationSpeed = 1,
  glowIntensity = 0.9
}) => {
  // Create organic flowing energy streams that match the reference image
  const centerX = width * 0.5;
  const centerY = height * 0.48;
  
  const flowingPaths = [
    // Main flowing energy stream - large loop on the left
    `M${centerX - width*0.35},${centerY - height*0.15}
     C${centerX - width*0.45},${centerY - height*0.25} ${centerX - width*0.4},${centerY - height*0.35} ${centerX - width*0.2},${centerY - height*0.32}
     C${centerX},${centerY - height*0.28} ${centerX + width*0.15},${centerY - height*0.2} ${centerX + width*0.12},${centerY - height*0.05}
     C${centerX + width*0.08},${centerY + height*0.1} ${centerX - width*0.05},${centerY + height*0.15} ${centerX - width*0.2},${centerY + height*0.12}
     C${centerX - width*0.35},${centerY + height*0.08} ${centerX - width*0.38},${centerY - height*0.02} ${centerX - width*0.35},${centerY - height*0.15}`,
    
    // Secondary energy stream - right side flow
    `M${centerX + width*0.32},${centerY - height*0.08}
     C${centerX + width*0.42},${centerY - height*0.18} ${centerX + width*0.38},${centerY - height*0.28} ${centerX + width*0.18},${centerY - height*0.25}
     C${centerX - width*0.02},${centerY - height*0.22} ${centerX - width*0.15},${centerY - height*0.1} ${centerX - width*0.12},${centerY + height*0.05}
     C${centerX - width*0.08},${centerY + height*0.2} ${centerX + width*0.05},${centerY + height*0.25} ${centerX + width*0.2},${centerY + height*0.22}
     C${centerX + width*0.35},${centerY + height*0.18} ${centerX + width*0.38},${centerY + height*0.03} ${centerX + width*0.32},${centerY - height*0.08}`,
    
    // Third energy stream - top crossing flow
    `M${centerX - width*0.15},${centerY - height*0.25}
     C${centerX - width*0.05},${centerY - height*0.35} ${centerX + width*0.1},${centerY - height*0.32} ${centerX + width*0.25},${centerY - height*0.22}
     C${centerX + width*0.35},${centerY - height*0.12} ${centerX + width*0.3},${centerY + height*0.05} ${centerX + width*0.15},${centerY + height*0.15}
     C${centerX},${centerY + height*0.25} ${centerX - width*0.2},${centerY + height*0.2} ${centerX - width*0.25},${centerY + height*0.05}
     C${centerX - width*0.28},${centerY - height*0.1} ${centerX - width*0.22},${centerY - height*0.2} ${centerX - width*0.15},${centerY - height*0.25}`,
    
    // Fourth energy stream - bottom crossing flow  
    `M${centerX + width*0.18},${centerY + height*0.28}
     C${centerX + width*0.08},${centerY + height*0.38} ${centerX - width*0.08},${centerY + height*0.35} ${centerX - width*0.22},${centerY + height*0.25}
     C${centerX - width*0.32},${centerY + height*0.15} ${centerX - width*0.28},${centerY - height*0.02} ${centerX - width*0.15},${centerY - height*0.12}
     C${centerX},${centerY - height*0.22} ${centerX + width*0.18},${centerY - height*0.18} ${centerX + width*0.22},${centerY - height*0.03}
     C${centerX + width*0.25},${centerY + height*0.12} ${centerX + width*0.22},${centerY + height*0.22} ${centerX + width*0.18},${centerY + height*0.28}`,
    
    // Fifth energy stream - inner spiral
    `M${centerX - width*0.1},${centerY - height*0.18}
     C${centerX + width*0.05},${centerY - height*0.22} ${centerX + width*0.18},${centerY - height*0.15} ${centerX + width*0.22},${centerY}
     C${centerX + width*0.18},${centerY + height*0.15} ${centerX + width*0.05},${centerY + height*0.22} ${centerX - width*0.1},${centerY + height*0.18}
     C${centerX - width*0.25},${centerY + height*0.12} ${centerX - width*0.28},${centerY - height*0.05} ${centerX - width*0.22},${centerY - height*0.12}
     C${centerX - width*0.15},${centerY - height*0.18} ${centerX - width*0.12},${centerY - height*0.18} ${centerX - width*0.1},${centerY - height*0.18}`,
    
    // Sixth energy stream - outer spiral
    `M${centerX + width*0.12},${centerY + height*0.2}
     C${centerX - width*0.03},${centerY + height*0.24} ${centerX - width*0.16},${centerY + height*0.17} ${centerX - width*0.2},${centerY + height*0.02}
     C${centerX - width*0.16},${centerY - height*0.13} ${centerX - width*0.03},${centerY - height*0.2} ${centerX + width*0.12},${centerY - height*0.16}
     C${centerX + width*0.27},${centerY - height*0.1} ${centerX + width*0.3},${centerY + height*0.07} ${centerX + width*0.24},${centerY + height*0.14}
     C${centerX + width*0.18},${centerY + height*0.2} ${centerX + width*0.15},${centerY + height*0.2} ${centerX + width*0.12},${centerY + height*0.2}`
  ];

  // Generate dense particles that follow the energy streams like in the reference
  const pathParticles = Array.from({ length: particleCount }, (_, i) => {
    const pathIndex = i % flowingPaths.length;
    // Layer assignment: 0-1 = background, 2-3 = middle, 4-5 = foreground
    const layer = pathIndex < 2 ? 'background' : 
                  pathIndex < 4 ? 'middle' : 
                  'prominent';
    
    // Vary particle sizes for authentic look
    const baseSize = layer === 'background' ? 0.8 : layer === 'middle' ? 1.2 : 1.5;
    const sizeVariation = Math.random() * 1.5 + 0.5;
    
    return {
      id: i,
      pathIndex,
      layer,
      size: baseSize * sizeVariation,
      delay: Math.random() * 20,
      duration: Math.random() * 12 + 6,
      opacity: layer === 'background' ? Math.random() * 0.4 + 0.2 :
               layer === 'middle' ? Math.random() * 0.6 + 0.3 :
               Math.random() * 0.8 + 0.4,
      // Add position along path for spacing
      pathPosition: Math.random()
    };
  });

  return (
    <div 
      className={`relative ${className}`}
      style={{ width, height }}
    >

      {/* Multi-layered flowing paths with 3D depth */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* Enhanced flowing line gradients */}
          <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: primaryColor, stopOpacity: 0.1 }} />
            <stop offset="25%" style={{ stopColor: accentColor, stopOpacity: 0.5 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.3 }} />
            <stop offset="75%" style={{ stopColor: secondaryColor, stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: primaryColor, stopOpacity: 0.1 }} />
          </linearGradient>
          
          {/* Ethereal wisp gradients */}
          <linearGradient id="middleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
            <stop offset="30%" style={{ stopColor: accentColor, stopOpacity: 0.7 }} />
            <stop offset="60%" style={{ stopColor: primaryColor, stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
          </linearGradient>
          
          {/* Luminous stream gradients */}
          <linearGradient id="foregroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: secondaryColor, stopOpacity: 0.3 }} />
            <stop offset="40%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
            <stop offset="70%" style={{ stopColor: accentColor, stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0.3 }} />
          </linearGradient>
          
          {/* Floating particle gradients */}
          <radialGradient id="backgroundParticle">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.8 }} />
            <stop offset="30%" style={{ stopColor: accentColor, stopOpacity: 0.6 }} />
            <stop offset="70%" style={{ stopColor: primaryColor, stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
          </radialGradient>
          
          <radialGradient id="middleParticle">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1.0 }} />
            <stop offset="20%" style={{ stopColor: '#ffffff', stopOpacity: 0.9 }} />
            <stop offset="50%" style={{ stopColor: accentColor, stopOpacity: 0.7 }} />
            <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
          </radialGradient>
          
          <radialGradient id="foregroundParticle">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1.0 }} />
            <stop offset="15%" style={{ stopColor: '#ffffff', stopOpacity: 0.95 }} />
            <stop offset="40%" style={{ stopColor: accentColor, stopOpacity: 0.8 }} />
            <stop offset="70%" style={{ stopColor: secondaryColor, stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
          </radialGradient>
          
          {/* Special effects filters */}
          <filter id="etherealGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="intenseGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feColorMatrix in="coloredBlur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2 0"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Additional layer gradients */}
          <linearGradient id="additionalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: primaryColor, stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: accentColor, stopOpacity: 0 }} />
          </linearGradient>
          
          <radialGradient id="additionalParticle">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: primaryColor, stopOpacity: 0 }} />
          </radialGradient>
          
          {/* Prominent white line gradients */}
          <linearGradient id="prominentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
            <stop offset="30%" style={{ stopColor: '#ffffff', stopOpacity: 0.9 }} />
            <stop offset="70%" style={{ stopColor: accentColor, stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
          </linearGradient>
          
          <radialGradient id="prominentParticle">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1.0 }} />
            <stop offset="30%" style={{ stopColor: accentColor, stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: secondaryColor, stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        
        {/* Background layer - 3D depth with perspective */}
        <g filter="url(#etherealGlow)" style={{ 
          filter: `blur(3px) drop-shadow(0 0 20px ${primaryColor}30)`,
          transform: 'scale(0.95) translateZ(-100px)',
          transformOrigin: 'center'
        }}>
          {flowingPaths.slice(0, 1).map((path, pathIndex) => (
            <g key={`bg-path-${pathIndex}`}>
              <path
                d={path}
                fill="none"
                stroke="url(#backgroundGradient)"
                strokeWidth="1"
                opacity={0.25}
                strokeLinecap="round"
                strokeDasharray="40 20"
                style={{
                  animation: `flow-pulse ${(15 + pathIndex) / animationSpeed}s ease-in-out infinite alternate, undulate-width ${(18 + pathIndex * 3) / animationSpeed}s ease-in-out infinite`
                }}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-60;0"
                  dur={`${12 / animationSpeed}s`}
                  repeatCount="indefinite"
                />
              </path>
              {pathParticles
                .filter(p => p.pathIndex === pathIndex && p.layer === 'background')
                .map(particle => (
                  <circle
                    key={`bg-particle-${particle.id}`}
                    r={particle.size}
                    fill="url(#backgroundParticle)"
                    opacity={particle.opacity}
                    style={{
                      animation: `wisp-flow ${(particle.duration + 2) / animationSpeed}s ease-in-out infinite`
                    }}
                  >
                    <animateMotion
                      dur={`${particle.duration / animationSpeed}s`}
                      repeatCount="indefinite"
                      begin={`${particle.delay}s`}
                      path={path}
                    />
                    <animate
                      attributeName="opacity"
                      values={`0;${particle.opacity * 0.7};${particle.opacity};${particle.opacity * 0.5};0`}
                      dur={`${particle.duration / animationSpeed}s`}
                      repeatCount="indefinite"
                      begin={`${particle.delay}s`}
                    />
                    <animate
                      attributeName="r"
                      values={`${particle.size * 0.5};${particle.size};${particle.size * 1.2};${particle.size * 0.8};${particle.size * 0.5}`}
                      dur={`${particle.duration / animationSpeed}s`}
                      repeatCount="indefinite"
                      begin={`${particle.delay}s`}
                    />
                  </circle>
                ))}
            </g>
          ))}
        </g>
        
        {/* Middle layer - authentic energy streams */}
        <g filter="url(#etherealGlow)" style={{ 
          filter: `blur(0.3px) drop-shadow(0 0 15px ${accentColor}60)`,
          transform: 'scale(0.99) translateZ(-25px)',
          transformOrigin: 'center' 
        }}>
          {flowingPaths.slice(2, 4).map((path, pathIndex) => (
            <g key={`middle-path-${pathIndex}`}>
              <path
                d={path}
                fill="none"
                stroke="url(#middleGradient)"
                strokeWidth="1.5"
                opacity={0.6}
                strokeLinecap="round"
                strokeDasharray="12 6 4 8"
                style={{
                  animation: `flow-pulse ${(3 + pathIndex * 0.3) / animationSpeed}s ease-in-out infinite alternate, undulate-width-medium ${(8 + pathIndex * 2) / animationSpeed}s ease-in-out infinite`
                }}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-40;0"
                  dur={`${7 / animationSpeed}s`}
                  repeatCount="indefinite"
                />
              </path>
              {pathParticles
                .filter(p => p.pathIndex === pathIndex + 2 && p.layer === 'middle')
                .map(particle => (
                  <circle
                    key={`middle-particle-${particle.id}`}
                    r={particle.size}
                    fill="url(#middleParticle)"
                    opacity={particle.opacity}
                    style={{
                      animation: `ethereal-drift ${(particle.duration + 1) / animationSpeed}s ease-in-out infinite`
                    }}
                  >
                    <animateMotion
                      dur={`${particle.duration / animationSpeed}s`}
                      repeatCount="indefinite"
                      begin={`${particle.delay}s`}
                      path={path}
                    />
                    <animate
                      attributeName="opacity"
                      values={`0;${particle.opacity * 0.8};${particle.opacity};${particle.opacity * 0.6};0`}
                      dur={`${particle.duration / animationSpeed}s`}
                      repeatCount="indefinite"
                      begin={`${particle.delay}s`}
                    />
                  </circle>
                ))}
            </g>
          ))}
        </g>
      </svg>

      {/* Main Content Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Flowing Border Animation */}
        <div 
          className="relative"
          style={{
            width: width * 0.75,
            height: height * 0.85,
          }}
        >
          {/* Organic flowing border - matching original design */}
          <svg 
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${width} ${height}`}
            style={{ filter: `drop-shadow(0 0 ${20 * glowIntensity}px ${accentColor}80)` }}
          >
            <defs>
              <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: accentColor, stopOpacity: 0.9 }}>
                  <animate attributeName="stop-color" 
                    values={`${accentColor};${primaryColor};${secondaryColor};${accentColor}`}
                    dur={`${6 / animationSpeed}s`} 
                    repeatCount="indefinite" />
                </stop>
                <stop offset="50%" style={{ stopColor: primaryColor, stopOpacity: 0.7 }}>
                  <animate attributeName="stop-color" 
                    values={`${primaryColor};${secondaryColor};${accentColor};${primaryColor}`}
                    dur={`${6 / animationSpeed}s`} 
                    repeatCount="indefinite" />
                </stop>
                <stop offset="100%" style={{ stopColor: secondaryColor, stopOpacity: 0.9 }}>
                  <animate attributeName="stop-color" 
                    values={`${secondaryColor};${accentColor};${primaryColor};${secondaryColor}`}
                    dur={`${6 / animationSpeed}s`} 
                    repeatCount="indefinite" />
                </stop>
              </linearGradient>
              
              <filter id="liquidGlow">
                <feGaussianBlur stdDeviation={4 * glowIntensity} result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Main liquid flowing border */}
            <path
              d={`M ${width * 0.15} ${height * 0.3} 
                  C ${width * 0.05} ${height * 0.1}, ${width * 0.4} ${height * 0.05}, ${width * 0.7} ${height * 0.15}
                  C ${width * 0.95} ${height * 0.25}, ${width * 0.9} ${height * 0.5}, ${width * 0.85} ${height * 0.7}
                  C ${width * 0.75} ${height * 0.95}, ${width * 0.4} ${height * 0.9}, ${width * 0.15} ${height * 0.75}
                  C ${width * 0.05} ${height * 0.6}, ${width * 0.1} ${height * 0.45}, ${width * 0.15} ${height * 0.3} Z`}
              fill="none"
              stroke="url(#liquidGradient)"
              strokeWidth="3"
              filter="url(#liquidGlow)"
              opacity={0.8}
            >
              <animate
                attributeName="d"
                values={`M ${width * 0.15} ${height * 0.3} 
                        C ${width * 0.05} ${height * 0.1}, ${width * 0.4} ${height * 0.05}, ${width * 0.7} ${height * 0.15}
                        C ${width * 0.95} ${height * 0.25}, ${width * 0.9} ${height * 0.5}, ${width * 0.85} ${height * 0.7}
                        C ${width * 0.75} ${height * 0.95}, ${width * 0.4} ${height * 0.9}, ${width * 0.15} ${height * 0.75}
                        C ${width * 0.05} ${height * 0.6}, ${width * 0.1} ${height * 0.45}, ${width * 0.15} ${height * 0.3} Z;
                        
                        M ${width * 0.12} ${height * 0.25} 
                        C ${width * 0.08} ${height * 0.15}, ${width * 0.45} ${height * 0.08}, ${width * 0.75} ${height * 0.18}
                        C ${width * 0.92} ${height * 0.3}, ${width * 0.88} ${height * 0.55}, ${width * 0.82} ${height * 0.75}
                        C ${width * 0.7} ${height * 0.92}, ${width * 0.35} ${height * 0.87}, ${width * 0.18} ${height * 0.72}
                        C ${width * 0.08} ${height * 0.55}, ${width * 0.08} ${height * 0.4}, ${width * 0.12} ${height * 0.25} Z;
                        
                        M ${width * 0.15} ${height * 0.3} 
                        C ${width * 0.05} ${height * 0.1}, ${width * 0.4} ${height * 0.05}, ${width * 0.7} ${height * 0.15}
                        C ${width * 0.95} ${height * 0.25}, ${width * 0.9} ${height * 0.5}, ${width * 0.85} ${height * 0.7}
                        C ${width * 0.75} ${height * 0.95}, ${width * 0.4} ${height * 0.9}, ${width * 0.15} ${height * 0.75}
                        C ${width * 0.05} ${height * 0.6}, ${width * 0.1} ${height * 0.45}, ${width * 0.15} ${height * 0.3} Z`}
                dur={`${8 / animationSpeed}s`}
                repeatCount="indefinite"
              />
            </path>
          </svg>

          {/* Inner content - properly centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Play Button Icon */}
            <div 
              className="relative group z-10 mb-8"
              style={{
                filter: `drop-shadow(0 0 ${20 * glowIntensity}px ${accentColor}60)`
              }}
            >
              {/* Icon background with soft glow */}
              <div 
                className="relative flex items-center justify-center"
                style={{
                  width: Math.min(width * 0.18, 140),
                  height: Math.min(width * 0.18, 140),
                  background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,255,255,0.15), rgba(0,170,255,0.1))`,
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  animation: `icon-pulse ${4 / animationSpeed}s ease-in-out infinite`,
                  border: `1px solid rgba(0,255,255,0.3)`
                }}
              >
                <Play 
                  className="text-white fill-current transform group-hover:scale-110 transition-transform duration-300" 
                  style={{ 
                    width: Math.min(width * 0.1, 70),
                    height: Math.min(width * 0.1, 70),
                    filter: `drop-shadow(0 0 15px rgba(255,255,255,0.8))`,
                    marginLeft: '4px' // Slight offset for visual centering of play icon
                  }}
                />
              </div>
            </div>

            {/* OPENCLIP PRO Text */}
            <div 
              className="relative z-10 text-center"
              style={{
                filter: `drop-shadow(0 0 ${15 * glowIntensity}px rgba(0,255,255,0.6))`
              }}
            >
              <h1 
                className="font-bold tracking-[0.25em] text-white"
                style={{
                  fontSize: Math.min(width * 0.08, 60),
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: '300',
                  letterSpacing: '0.15em',
                  background: 'linear-gradient(135deg, #ffffff 0%, #00ffff 50%, #00aaff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: `text-glow ${8 / animationSpeed}s ease-in-out infinite`
                }}
              >
                OPENCLIP PRO
              </h1>
            </div>

          </div>
                </div>
      </div>

      {/* Prominent energy streams - foreground flows */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-25" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="prominentGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.7 }} />
            <stop offset="25%" style={{ stopColor: '#ffffff', stopOpacity: 1.0 }} />
            <stop offset="50%" style={{ stopColor: accentColor, stopOpacity: 1.0 }} />
            <stop offset="75%" style={{ stopColor: '#ffffff', stopOpacity: 1.0 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0.7 }} />
          </linearGradient>
          <radialGradient id="prominentParticle2">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1.0 }} />
            <stop offset="30%" style={{ stopColor: accentColor, stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: primaryColor, stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <g filter="url(#intenseGlow)" style={{
          filter: `drop-shadow(0 0 ${25 * glowIntensity}px #ffffff90) drop-shadow(0 0 ${35 * glowIntensity}px ${accentColor}80)`,
          transform: 'scale(1.02) translateZ(25px)',
          transformOrigin: 'center'
        }}>
          {flowingPaths.slice(4, 6).map((path, pathIndex) => (
            <g key={`prominent-path-${pathIndex}`}>
              <path
                d={path}
                fill="none"
                stroke="url(#prominentGradient2)"
                strokeWidth="2"
                opacity={0.9}
                strokeLinecap="round"
                strokeDasharray={pathIndex === 0 ? "16 4 8 2" : "12 6 4 8"}
                style={{
                  animation: `flow-pulse ${(2 + pathIndex * 0.2) / animationSpeed}s ease-in-out infinite alternate, undulate-width-thick ${(5 + pathIndex * 0.5) / animationSpeed}s ease-in-out infinite`
                }}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-30;0"
                  dur={`${(3.5 + pathIndex * 0.3) / animationSpeed}s`}
                  repeatCount="indefinite"
                />
              </path>
              {pathParticles
                .filter(p => p.pathIndex === pathIndex + 4 && p.layer === 'prominent')
                .map(particle => (
                  <circle
                    key={`prominent-particle-${particle.id}`}
                    r={particle.size}
                    fill="url(#prominentParticle2)"
                    opacity={particle.opacity}
                    style={{
                      animation: `ethereal-drift ${(particle.duration * 0.8) / animationSpeed}s ease-in-out infinite`
                    }}
                  >
                    <animateMotion
                      dur={`${particle.duration / animationSpeed}s`}
                      repeatCount="indefinite"
                      begin={`${particle.delay}s`}
                      path={path}
                    />
                    <animate
                      attributeName="opacity"
                      values={`0;${particle.opacity * 0.8};${particle.opacity};${particle.opacity * 0.9};0`}
                      dur={`${particle.duration / animationSpeed}s`}
                      repeatCount="indefinite"
                      begin={`${particle.delay}s`}
                    />
                    <animate
                      attributeName="r"
                      values={`${particle.size * 0.4};${particle.size * 0.9};${particle.size};${particle.size * 1.2};${particle.size * 0.4}`}
                      dur={`${particle.duration / animationSpeed}s`}
                      repeatCount="indefinite"
                      begin={`${particle.delay}s`}
                    />
                  </circle>
                ))}
            </g>
          ))}
        </g>
      </svg>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes mesh-float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(15px, -10px) rotate(0.5deg); }
            66% { transform: translate(-10px, 15px) rotate(-0.5deg); }
          }
          
          @keyframes ethereal-drift {
            0%, 100% { transform: translate(0, 0) scale(0.8); opacity: 0.2; }
            25% { transform: translate(20px, -30px) scale(1.2); opacity: 0.6; }
            50% { transform: translate(-15px, -40px) scale(0.9); opacity: 0.8; }
            75% { transform: translate(-25px, -15px) scale(1.1); opacity: 0.4; }
          }
          
          @keyframes flow-pulse {
            0%, 100% { 
              opacity: 0.1; 
              filter: blur(0.5px);
            }
            25% { 
              opacity: 0.4; 
              filter: blur(0.2px);
            }
            50% { 
              opacity: 0.8; 
              filter: blur(0px);
            }
            75% { 
              opacity: 0.6; 
              filter: blur(0.1px);
            }
          }
          
          @keyframes undulate-width {
            0% { stroke-width: 1px; }
            12% { stroke-width: 2.5px; }
            25% { stroke-width: 1.8px; }
            38% { stroke-width: 3.2px; }
            50% { stroke-width: 2px; }
            62% { stroke-width: 4px; }
            75% { stroke-width: 1.5px; }
            88% { stroke-width: 3.5px; }
            100% { stroke-width: 1px; }
          }
          
          @keyframes undulate-width-medium {
            0% { stroke-width: 2px; }
            15% { stroke-width: 4px; }
            30% { stroke-width: 2.8px; }
            45% { stroke-width: 5px; }
            60% { stroke-width: 3px; }
            75% { stroke-width: 5.5px; }
            90% { stroke-width: 2.5px; }
            100% { stroke-width: 2px; }
          }
          
          @keyframes undulate-width-thick {
            0% { stroke-width: 3px; }
            20% { stroke-width: 6px; }
            40% { stroke-width: 4px; }
            60% { stroke-width: 7px; }
            80% { stroke-width: 3.5px; }
            100% { stroke-width: 3px; }
          }
          
          @keyframes wisp-flow {
            0%, 100% { 
              transform: scale(1) rotate(0deg); 
              opacity: 0.1; 
            }
            33% { 
              transform: scale(1.1) rotate(120deg); 
              opacity: 0.3; 
            }
            66% { 
              transform: scale(0.9) rotate(240deg); 
              opacity: 0.2; 
            }
          }
          
          @keyframes icon-pulse {
            0%, 100% { transform: scale(1); opacity: 0.85; }
            50% { transform: scale(1.08); opacity: 1; }
          }
          
          @keyframes ring-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes text-glow {
            0%, 100% { 
              filter: drop-shadow(0 0 8px ${primaryColor}50) drop-shadow(0 0 16px ${primaryColor}30); 
            }
            33% { 
              filter: drop-shadow(0 0 12px ${accentColor}60) drop-shadow(0 0 24px ${accentColor}40); 
            }
            66% { 
              filter: drop-shadow(0 0 10px ${secondaryColor}55) drop-shadow(0 0 20px ${secondaryColor}35); 
            }
          }
        `
      }} />
    </div>
  );
};

export default LogoDisplay; 