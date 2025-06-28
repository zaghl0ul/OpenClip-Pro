import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Sparkles, Zap, Target, ArrowRight, Star } from 'lucide-react';
import GeometricPattern from '../components/Common/GeometricPattern';
import AnimatedWaveBackground from '../components/Common/AnimatedWaveBackground';
import OpenClipProImageLogo from '../components/Common/OpenClipProImageLogo';
import BetaSignupModal from '../components/Beta/BetaSignupModal';
import {
  detectDevicePerformance,
  startPerformanceMonitoring,
  getOptimalSettings,
} from '../utils/performance';

const Landing = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [performanceSettings, setPerformanceSettings] = useState(null);
  const [showBetaSignup, setShowBetaSignup] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Initialize performance monitoring
    startPerformanceMonitoring();

    // Detect device performance and adjust settings
    const devicePerformance = detectDevicePerformance();
    const optimalSettings = getOptimalSettings();
    setPerformanceSettings({
      showAnimations: devicePerformance !== 'low' && optimalSettings.animationsEnabled,
      performanceMode: optimalSettings.performanceMode,
      reducedPatterns: devicePerformance === 'low' || optimalSettings.performanceMode,
    });

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Analysis',
      description:
        'Advanced machine learning algorithms analyze your videos to identify the most engaging moments automatically.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast Processing',
      description:
        'Process hours of content in minutes with our optimized video processing engine and smart thumbnail generation.',
    },
    {
      icon: Target,
      title: 'Precision Editing',
      description:
        'Fine-tune your clips with frame-perfect accuracy and professional-grade editing tools built for creators.',
    },
  ];



  // Optimized animation settings based on performance
  const getAnimationProps = (delay = 0) => {
    if (!performanceSettings?.showAnimations) {
      return { initial: { opacity: 1 }, animate: { opacity: 1 } };
    }

    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, delay },
    };
  };

  // Render geometric patterns only on high-performance devices
  const renderGeometricPattern = (variant, size, opacity, color, className) => {
    if (performanceSettings?.reducedPatterns) {
      return null; // Skip patterns on low-performance devices
    }

    return (
      <GeometricPattern
        variant={variant}
        size={size}
        opacity={opacity}
        animate={performanceSettings?.showAnimations}
        color={color}
        className={className}
        performanceMode={performanceSettings?.performanceMode}
      />
    );
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background overflow-hidden relative">
      {/* Animated Wave Background - Full Page */}
      <AnimatedWaveBackground 
        intensity={performanceSettings?.reducedPatterns ? 'subtle' : 'medium'}
        animate={performanceSettings?.showAnimations !== false}
      />
      
      {/* Optimized Background Elements - Simplified */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-5 z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-accent)_0%,_transparent_50%)] opacity-5 z-0"></div>

      {/* Navigation - Simplified */}
      <nav className="relative z-50 px-6 py-6 backdrop-blur-sm bg-background/20">
        {/* Single navigation pattern for high-performance devices only */}
        {!isMobile && (
          <div className="absolute top-0 right-0 opacity-40">
            {renderGeometricPattern('simple', 'small', 0.2, 'primary', 'w-16 h-16')}
          </div>
        )}

        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          <motion.div {...getAnimationProps(0)}>
            <OpenClipProImageLogo 
              size="small" 
              animate={performanceSettings?.showAnimations}
              showText={!isMobile}
            />
          </motion.div>

          <motion.div {...getAnimationProps(0.1)} className="flex items-center space-x-6">
            <button
              onClick={() => setShowBetaSignup(true)}
              className="btn-glass px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            >
              Join Beta
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section - Single optimized pattern */}
      <section className="relative z-20 px-6 py-20">
        {/* Single hero decoration - only on desktop high-performance */}
        {!isMobile && (
          <div className="absolute top-20 right-20 opacity-30">
            {renderGeometricPattern('grid', 'medium', 0.15, 'primary', 'w-24 h-24')}
          </div>
        )}
        


        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-1 gap-12 lg:gap-16 items-center text-center">
            <motion.div
              {...getAnimationProps(0.2)}
              className="space-y-8 max-w-4xl mx-auto relative"
            >
              {/* Hero Logo */}
              <motion.div 
                {...getAnimationProps(0.1)}
                className="flex justify-center mb-8"
              >
                <OpenClipProImageLogo 
                  size={isMobile ? "xlarge" : "hero"} 
                  animate={performanceSettings?.showAnimations}
                  showText={false}
                  className="drop-shadow-2xl"
                />
              </motion.div>

              <div className="space-y-6">
                <motion.div
                  {...getAnimationProps(0.3)}
                  className="inline-flex items-center px-4 py-2 rounded-full glass-minimal border border-primary/20 text-sm font-medium"
                >
                  <Star className="w-4 h-4 mr-2 text-accent" />
                  AI-Powered Video Intelligence
                </motion.div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Transform Videos
                  </span>
                  <span className="block text-secondary">Into Viral Clips</span>
                  <span className="block text-3xl sm:text-4xl lg:text-5xl text-subtle font-medium mt-2">
                    Instantly with AI
                  </span>
                </h1>

                <p className="text-xl lg:text-2xl text-subtle leading-relaxed max-w-3xl mx-auto">
                  🚀 <strong>Join our exclusive beta!</strong> Transform your long-form content into engaging short clips with AI-powered
                  analysis. Perfect for YouTube Shorts, TikTok, Instagram Reels, and more.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowBetaSignup(true)}
                  className="group bg-gradient-to-r from-primary to-accent text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/25 flex items-center justify-center"
                >
                  Get Early Access
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>


            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Minimal decoration */}
      <section className="relative z-20 px-6 py-20 backdrop-blur-sm bg-background/10">

        <div className="max-w-7xl mx-auto">
          <motion.div {...getAnimationProps(0.5)} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Powered by Advanced
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Technology
              </span>
            </h2>
            <p className="text-xl text-subtle max-w-3xl mx-auto">
              Our cutting-edge algorithms analyze video content, identify key moments, and create
              optimized clips that maximize engagement and reach.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                {...getAnimationProps(0.6 + index * 0.1)}
                className="glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-300 group backdrop-blur-md bg-background/40 border border-primary/10"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-subtle leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Subtle wave accent */}
      <section className="relative z-20 px-6 py-20 backdrop-blur-sm bg-background/10">

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            {...getAnimationProps(0.7)}
            className="glass-card p-12 rounded-3xl backdrop-blur-md bg-background/40 border border-primary/10"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Create
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Amazing Content?
              </span>
            </h2>
            <p className="text-xl text-subtle mb-8 max-w-2xl mx-auto">
              Start transforming your content with AI-powered video analysis and automated clip generation.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowBetaSignup(true)}
                className="inline-flex items-center bg-gradient-to-r from-primary to-accent text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/25"
              >
                Get Beta Access
                <ArrowRight className="w-6 h-6 ml-3" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Beta Signup Modal */}
      <BetaSignupModal 
        isOpen={showBetaSignup} 
        onClose={() => setShowBetaSignup(false)} 
      />
    </div>
  );
};

export default Landing;
