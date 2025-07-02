import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import p5 from 'p5';
import './BrainHero.css';
import { 
  TrendingUpIcon, SparklesIcon, BrainIcon, XIcon, VideoIcon, SettingsIcon, 
  LoaderIcon, ZapIcon, ActivityIcon, CheckCircleIcon, PlayIcon, EyeIcon,
  AlertTriangleIcon, XCircleIcon, RefreshCwIcon, ClockIcon, CheckIcon,
  AlertCircleIcon, LinkIcon, TrashIcon, PlusIcon, SearchIcon, Grid3X3Icon,
  ListIcon, ArrowRightIcon, ChevronRightIcon, UploadIcon, DownloadIcon,
  ShareIcon, FileTextIcon, MoreVerticalIcon, EditIcon, UserIcon, BellIcon,
  HelpCircleIcon, MenuIcon, FolderIcon, FilmIcon, TargetIcon, PaletteIcon,
  VolumeXIcon, Volume2Icon, SkipBackIcon, SkipForwardIcon, PauseIcon,
  MaximizeIcon, ScissorsIcon, LayersIcon, TrendingDownIcon, StarIcon,
  MailIcon, SendIcon, UsersIcon, MessageSquareIcon, HomeIcon, YoutubeIcon,
  BarChart2Icon, KeyIcon, ShieldIcon, ArrowLeftIcon
} from '../Common/icons';

const BrainHero = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [p5Instance, setP5Instance] = useState(null);
  const [brainImage, setBrainImage] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const newScrollY = window.scrollY;
      if (Math.abs(newScrollY - scrollRef.current) > 5) { // Only update if significant change
        scrollRef.current = newScrollY;
        setScrollY(newScrollY);
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    // Cleanup any existing p5 instance
    if (p5Instance) {
      p5Instance.remove();
      setP5Instance(null);
    }

    // Create p5 sketch with performance optimizations
    const sketch = (p) => {
      const numLines = 40; // Reduced from 60 for better performance
      const noiseScale = 0.01;
      const baseNoiseStrength = 50; // Reduced for smoother animation
      const lineResolution = 8; // Increased for better performance
      let noiseZ = 0;
      let mouseInfluence = 1;
      let colorShift = 1;
      let rgbPulseTime = 0;
      let waveTime = 0;
      let opacity = 1;

      p.setup = () => {
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvas.parent(canvasRef.current);
        p.background(0);
      };

      p.draw = () => {
        // Smooth opacity calculation with easing
        const fadeStart = window.innerHeight * 0.4; // Start fade earlier
        const fadeEnd = window.innerHeight * 1.0; // End fade at 100%
        const scrollProgress = p.map(scrollRef.current, fadeStart, fadeEnd, 1, 0);
        const targetOpacity = p.constrain(scrollProgress, 0, 1);
        
        // Smooth interpolation for opacity
        opacity = p.lerp(opacity, targetOpacity, 0.05);
        
        // Only draw if opacity > 0.01
        if (opacity > 0.01) {
          // Subtle background with your color palette
          p.background(0, 0, 0, 40 * opacity);
          
          rgbPulseTime += 0.01; // Reduced speed
          waveTime += 0.005; // Reduced speed
          noiseZ = waveTime * 0.3; // Reduced speed
          
          // Gentle autonomous movement
          mouseInfluence = 1 + p.sin(waveTime * 1.5) * 0.2; // Reduced intensity
          colorShift = 1 + p.sin(waveTime * 1.0) * 0.15; // Reduced intensity
          
          const currentNoiseStrength = baseNoiseStrength * mouseInfluence;

          drawHeroBrain(p, currentNoiseStrength, opacity);
          drawSubtleGlow(p, opacity);
        } else {
          // Clear the canvas when fully faded out
          p.clear();
        }
      };

      const drawHeroBrain = (p, currentNoiseStrength, opacity) => {
        const brainMinY = p.height * 0.2;
        const brainMaxY = p.height * 0.85;
        const lineSpacing = (brainMaxY - brainMinY) / (numLines - 1);

        for (let i = 0; i < numLines; i++) {
          const centerDistance = p.abs(i - numLines/2) / (numLines/2);
          
          // Using your color palette with more noticeable RGB pulses
          const rPulse = p.sin(rgbPulseTime * 0.6 + i * 0.08) * 0.3 + 0.7; // Reduced intensity
          const gPulse = p.sin(rgbPulseTime * 0.8 + i * 0.1 + p.PI/3) * 0.3 + 0.7;
          const bPulse = p.sin(rgbPulseTime * 0.7 + i * 0.06 + p.PI*2/3) * 0.3 + 0.7;
          
          // Base colors from your palette (#7A7084, #BBA8DD)
          const baseR = 100 + (187 - 100) * colorShift * 0.8;
          const baseG = 90 + (168 - 90) * colorShift * 0.8;
          const baseB = 110 + (221 - 110) * colorShift * 0.8;
          
          const r = baseR * rPulse;
          const g = baseG * gPulse;
          const b = baseB * bPulse;
          
          const alpha = p.map(centerDistance, 0, 1, 100, 25) * mouseInfluence * opacity; // Reduced alpha
          const strokeWeight_val = p.map(centerDistance, 0, 1, 1.5, 0.3); // Reduced stroke weight
          
          p.stroke(r, g, b, alpha);
          p.strokeWeight(strokeWeight_val);
          p.noFill();
          
          p.beginShape();
          const y = brainMinY + i * lineSpacing;
          
          let curveFactor = p.sin(p.map(i, 0, numLines - 1, 0, p.PI));
          curveFactor += p.sin(p.map(i, 0, numLines - 1, 0, p.PI * 2)) * 0.1; // Reduced variation
          curveFactor = p.abs(curveFactor);
          
          const normalizedPos = i / (numLines - 1);
          let xSpan = p.map(curveFactor, 0, 1.1, p.width * 0.25, p.width * 0.7);
          
          if (normalizedPos < 0.3) {
            xSpan *= (0.75 + normalizedPos * 0.7);
          }
          if (normalizedPos > 0.7) {
            xSpan *= (1.15 - (normalizedPos - 0.7) * 0.4);
          }
          
          const startX = (p.width - xSpan) / 2;
          const verticalOffset = p.map(i, 0, numLines-1, -p.width*0.008, p.width*0.015); // Reduced offset
          const adjustedStartX = startX + verticalOffset;

          for (let x = adjustedStartX; x <= adjustedStartX + xSpan; x += lineResolution) {
            const nx = x * noiseScale;
            const ny = y * noiseScale;
            const nz = noiseZ;

            const primaryNoise = p.noise(nx, ny, nz);
            const secondaryNoise = p.noise(nx * 1.5, ny * 1.5, nz * 1.2); // Reduced complexity
            const flowNoise = p.noise(nx * 0.4, ny * 0.4, nz * 1.5);
            
            const primaryOffset = p.map(primaryNoise, 0, 1, -currentNoiseStrength, currentNoiseStrength);
            const secondaryOffset = p.map(secondaryNoise, 0, 1, -currentNoiseStrength * 0.2, currentNoiseStrength * 0.2);
            const flowOffset = p.map(flowNoise, 0, 1, -currentNoiseStrength * 0.3, currentNoiseStrength * 0.3);
            
            const totalOffset = (primaryOffset + secondaryOffset + flowOffset) * p.pow(curveFactor, 0.8);
            
            p.vertex(x, y + totalOffset);
          }
          p.endShape();
        }
      };

      const drawSubtleGlow = (p, opacity) => {
        // Reduced glow complexity for better performance
        for (let r = 200; r > 0; r -= 80) { // Reduced range and step
          const alpha = p.map(r, 0, 200, 10, 0) * mouseInfluence * 0.6 * opacity; // Reduced alpha
          
          // RGB pulses in the glow
          const rGlow = p.sin(rgbPulseTime * 0.7) * 0.2 + 0.8; // Reduced intensity
          const gGlow = p.sin(rgbPulseTime * 0.9 + p.PI/3) * 0.2 + 0.8;
          const bGlow = p.sin(rgbPulseTime * 0.5 + p.PI*2/3) * 0.2 + 0.8;
          
          p.stroke(187 * rGlow, 168 * gGlow, 221 * bGlow, alpha);
          p.strokeWeight(1);
          p.noFill();
          p.ellipse(p.width/2, p.height/2, r);
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
      };
    };

    // Create p5 instance
    const newP5Instance = new p5(sketch);
    setP5Instance(newP5Instance);

    // Cleanup function
    return () => {
      if (newP5Instance) {
        newP5Instance.remove();
      }
    };
  }, []); // Remove scrollY dependency to prevent recreation

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBrainImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartCreating = () => {
    navigate('/dashboard');
  };

  return (
    <div className="parallax-container">
      {/* Hero Section with Parallax */}
      <section className="hero parallax-section">
        <div className="brain-background" ref={canvasRef}></div>
        {brainImage && (
          <img 
            src={brainImage} 
            className="brain-image" 
            alt="Brain"
            style={{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.1}px)` }}
          />
        )}
        
        <div className="file-input-container">
          <label htmlFor="file-input" className="upload-btn">Upload Brain Image</label>
          <input 
            type="file" 
            id="file-input" 
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>
        
        <div 
          className="hero-content"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <h1 className="hero-title">OpenClip-Pro</h1>
          <p className="hero-subtitle">AI-Powered Video Analysis &amp; Clipping</p>
          <p className="hero-description">
            Transform your video content with cutting-edge neural networks. 
            Automatic clip generation powered by GPT-4 Vision, Google Gemini, and Anthropic Claude.
          </p>
          
          <button 
            type="button"
            className="cta-button"
            onClick={handleStartCreating}
          >
            Start Creating
          </button>
        </div>
      </section>

      {/* Features Section with Parallax */}
      <section className="features-section parallax-section">
        <div 
          className="features-grid"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <div className="feature">
            <div className="feature-icon">🧠</div>
            <div className="feature-title">Neural Analysis</div>
            <div className="feature-text">Advanced AI models analyze video content</div>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Real-time Processing</div>
            <div className="feature-text">Live progress tracking and status updates</div>
          </div>
          <div className="feature">
            <div className="feature-icon">🎬</div>
            <div className="feature-title">Auto Clipping</div>
            <div className="feature-text">Intelligent clip generation from long-form content</div>
          </div>
        </div>
      </section>

      {/* Additional Content Sections */}
      <section className="content-section parallax-section">
        <div 
          className="content-block"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        >
          <h2>Advanced AI Technology</h2>
          <p>Leverage the power of multiple AI models working in harmony to deliver unprecedented video analysis capabilities.</p>
        </div>
      </section>

      <section className="content-section parallax-section">
        <div 
          className="content-block"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <h2>Seamless Workflow</h2>
          <p>From upload to final clip, experience a streamlined process designed for content creators.</p>
        </div>
      </section>
    </div>
  );
};

export default BrainHero; 