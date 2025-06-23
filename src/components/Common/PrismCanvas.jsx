import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

const PrismCanvas = ({ width = 600, height = 600, className = '' }) => {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadP5 = async () => {
      try {
        // Dynamic import of p5
        const p5Module = await import('p5');
        const p5 = p5Module.default;

        if (!containerRef.current) return;

        const sketch = (p) => {
          let R = Math.min(width, height) * 0.18; // Radius for octahedron base (increased)
          let H = Math.min(width, height) * 0.25; // Half height for octahedron (increased)
          let octahedronVertices = [];
          let time = 0;
          let rotationSpeed = 0.5;

          p.setup = () => {
            const canvas = p.createCanvas(width, height, p.WEBGL);
            canvas.parent(containerRef.current);
            p.angleMode(p.DEGREES);

            // Define the 6 vertices of the octahedron
            octahedronVertices[0] = p.createVector(0, H, 0);   // Top vertex
            octahedronVertices[1] = p.createVector(0, -H, 0);  // Bottom vertex
            octahedronVertices[2] = p.createVector(R, 0, 0);   // Right-most vertex
            octahedronVertices[3] = p.createVector(-R, 0, 0);  // Left-most vertex
            octahedronVertices[4] = p.createVector(0, 0, R);   // Front-most vertex
            octahedronVertices[5] = p.createVector(0, 0, -R);  // Back-most vertex

            p.colorMode(p.HSB, 360, 100, 100, 100);
            setIsLoaded(true);
            setError(null);
          };

          p.draw = () => {
            // Use a dark background instead of clear() for WEBGL
            p.background(0, 0, 0, 0); // Transparent background
            time += rotationSpeed;

            // Enhanced lighting setup for better visibility
            p.ambientLight(60); // Increased ambient light
            p.directionalLight(255, 255, 255, -0.5, 0.5, -1); // Better directional light
            p.pointLight(255, 255, 255, 100, -100, 100); // Additional point light

            // Reset transformations and center the octahedron
            p.push();
            
            // Enhanced rotation with mouse influence
            const mouseInfluenceX = p.map(p.mouseX, 0, p.width, -60, 60);
            const mouseInfluenceY = p.map(p.mouseY, 0, p.height, -60, 60);
            
            // Smooth auto-rotation combined with mouse interaction
            p.rotateY(time * 0.8 + mouseInfluenceX * 0.05);
            p.rotateX(time * 0.6 + mouseInfluenceY * 0.05);
            p.rotateZ(time * 0.4);

            drawOctahedron(p);
            p.pop();
          };

          const drawOctahedron = (p) => {
            // Simplified approach: Draw multiple spheres and boxes to create prism-like effect
            p.push();
            
            // Create rainbow prism effect with multiple layers
            for (let layer = 0; layer < 8; layer++) {
              p.push();
              
              // Rainbow colors cycling through spectrum
              const hue = (layer * 45 + time * 3) % 360;
              const alpha = 60 + layer * 5; // Varying transparency
              
              p.fill(hue, 80, 90, alpha);
              p.stroke(hue, 90, 100, 100);
              p.strokeWeight(1);
              
              // Create octahedron-like shape using rotated boxes
              p.rotateX(layer * 15);
              p.rotateY(layer * 20);
              p.rotateZ(layer * 10);
              
              // Scale varies per layer for depth effect
              const scale = 0.8 + layer * 0.1;
              p.scale(scale);
              
              // Draw diamond/octahedron shape
              p.box(R * 1.5, H * 1.5, R * 1.5);
              
              p.pop();
            }
            
            // Add central core for definition
            p.push();
            p.fill(0, 0, 100, 30); // Bright white core
            p.noStroke();
            p.sphere(R * 0.3);
            p.pop();
            
            p.pop();
          };

          p.windowResized = () => {
            // Fix: Use current container dimensions instead of props
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const newWidth = Math.min(rect.width || width, width);
              const newHeight = Math.min(rect.height || height, height);
              p.resizeCanvas(newWidth, newHeight);
            }
          };

          p.mousePressed = () => {
            // Increase rotation speed on interaction
            rotationSpeed = 1.2;
          };

          p.mouseReleased = () => {
            // Return to normal speed
            rotationSpeed = 0.5;
          };
        };

        p5InstanceRef.current = new p5(sketch);
      } catch (err) {
        console.error('Error loading p5.js:', err);
        setError('Failed to load 3D animation');
        setIsLoaded(false);
      }
    };

    loadP5();

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [width, height]);

  // Fallback UI when p5.js fails to load
  const FallbackPrism = () => (
    <div 
      className="flex items-center justify-center bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-2xl border border-primary/30"
      style={{ width: width, height: height }}
    >
      <div className="relative">
        {/* Static SVG Prism */}
        <svg width="200" height="200" viewBox="0 0 200 200" className="animate-spin" style={{ animationDuration: '20s' }}>
          <defs>
            <linearGradient id="prism-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff0080" stopOpacity="0.8"/>
              <stop offset="16.66%" stopColor="#ff8000" stopOpacity="0.8"/>
              <stop offset="33.33%" stopColor="#ffff00" stopOpacity="0.8"/>
              <stop offset="50%" stopColor="#80ff00" stopOpacity="0.8"/>
              <stop offset="66.66%" stopColor="#00ff80" stopOpacity="0.8"/>
              <stop offset="83.33%" stopColor="#0080ff" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#8000ff" stopOpacity="0.8"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Octahedron faces as polygons */}
          <polygon points="100,40 130,100 100,160" fill="url(#prism-gradient)" filter="url(#glow)" opacity="0.7"/>
          <polygon points="100,40 70,100 100,160" fill="url(#prism-gradient)" filter="url(#glow)" opacity="0.6"/>
          <polygon points="100,40 130,100 70,100" fill="url(#prism-gradient)" filter="url(#glow)" opacity="0.8"/>
          <polygon points="100,160 130,100 70,100" fill="url(#prism-gradient)" filter="url(#glow)" opacity="0.5"/>
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-accent animate-pulse" />
        </div>
      </div>
    </div>
  );

  const LoadingState = () => (
    <div 
      className="flex items-center justify-center glass-minimal rounded-2xl"
      style={{ width: width, height: height }}
    >
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
        <div className="text-subtle text-sm">Loading 3D Prism...</div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* P5.js Container */}
      <div 
        ref={containerRef}
        className={`transition-opacity duration-1000 ${isLoaded && !error ? 'opacity-100' : 'opacity-0'}`}
        style={{ width: width, height: height }}
      />
      
      {/* Loading State */}
      {!isLoaded && !error && (
        <div className="absolute inset-0">
          <LoadingState />
        </div>
      )}
      
      {/* Error Fallback */}
      {error && (
        <div className="absolute inset-0">
          <FallbackPrism />
        </div>
      )}
      
      {/* Interaction Hint */}
      {isLoaded && !error && (
        <div className="absolute bottom-4 right-4 text-xs text-subtle bg-black/20 backdrop-blur-sm px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity">
          Move mouse to interact
        </div>
      )}
    </div>
  );
};

export default PrismCanvas; 