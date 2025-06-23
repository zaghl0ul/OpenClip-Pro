import React from 'react';

const AnimatedPrism = ({ width = 600, height = 600, className = '' }) => {
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-2xl blur-2xl animate-pulse"></div>
      
      {/* Main prism container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer rotating prism */}
        <div 
          className="absolute w-80 h-80 rounded-3xl border-2 border-white/10 backdrop-blur-lg"
          style={{ 
            background: 'linear-gradient(45deg, #ff0080, #ff8000, #ffff00, #80ff00, #00ff80, #0080ff, #8000ff, #ff0080)',
            backgroundSize: '400% 400%',
            animation: 'prism-rotate 20s linear infinite, gradient-shift 8s ease-in-out infinite',
            opacity: 0.7
          }}
        />

        {/* Middle rotating prism */}
        <div 
          className="absolute w-64 h-64 rounded-2xl border border-white/20 backdrop-blur-md"
          style={{ 
            background: 'linear-gradient(135deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
            backgroundSize: '300% 300%',
            animation: 'prism-rotate-reverse 15s linear infinite, gradient-shift 6s ease-in-out infinite reverse',
            opacity: 0.8
          }}
        />

        {/* Inner core */}
        <div 
          className="absolute w-32 h-32 rounded-full border-2 border-white/30 backdrop-blur-xl"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(88,166,255,0.7) 50%, rgba(247,129,102,0.7) 100%)',
            animation: 'pulse 2s ease-in-out infinite',
            boxShadow: '0 0 50px rgba(255,255,255,0.5), inset 0 0 50px rgba(88,166,255,0.3)',
            opacity: 0.95
          }}
        />
      </div>
      
      {/* Refraction light beams */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { color: '#ff0080', top: '20%', left: '20%', rotation: '15deg' },
          { color: '#00ff80', top: '30%', right: '25%', rotation: '-25deg' },
          { color: '#0080ff', bottom: '30%', left: '30%', rotation: '45deg' },
          { color: '#ffff00', bottom: '20%', right: '20%', rotation: '-15deg' },
          { color: '#ff8000', top: '50%', left: '50%', rotation: '0deg' }
        ].map((beam, index) => (
          <div
            key={`beam-${index}`}
            className="absolute w-1 h-48 opacity-60 rounded-full animate-pulse"
            style={{
              background: `linear-gradient(to bottom, transparent, ${beam.color}, transparent)`,
              top: beam.top,
              bottom: beam.bottom,
              left: beam.left,
              right: beam.right,
              transform: `rotate(${beam.rotation})`,
              animationDelay: `${index * 0.8}s`,
              animationDuration: '4s',
              filter: 'blur(1px)',
              boxShadow: `0 0 10px ${beam.color}`
            }}
          />
        ))}
      </div>
      
      {/* Interaction hint */}
      <div className="absolute bottom-4 right-4 text-xs text-subtle bg-black/20 backdrop-blur-sm px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity">
        Light refraction in action
      </div>

      {/* Add the CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes prism-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes prism-rotate-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `
      }} />
    </div>
  );
};

export default AnimatedPrism; 