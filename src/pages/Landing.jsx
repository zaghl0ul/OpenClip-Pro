import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Sparkles, Zap, Target, ArrowRight, Download, Star } from 'lucide-react';
import LogoDisplay from '../components/Common/LogoDisplay';

const Landing = () => {
  const [canvasSize, setCanvasSize] = useState({ width: 700, height: 700 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const size = window.innerWidth < 768 ? 500 : window.innerWidth < 1024 ? 600 : 700;
      setCanvasSize({ width: size, height: size });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze your videos to identify the most engaging moments automatically."
    },
    {
      icon: Zap,
      title: "Lightning Fast Processing",
      description: "Process hours of content in minutes with our optimized video processing engine and smart thumbnail generation."
    },
    {
      icon: Target,
      title: "Precision Editing",
      description: "Fine-tune your clips with frame-perfect accuracy and professional-grade editing tools built for creators."
    }
  ];

  const stats = [
    { number: "10M+", label: "Hours Processed" },
    { number: "500K+", label: "Creators Trust Us" },
    { number: "99.9%", label: "Uptime Guaranteed" },
    { number: "4.9/5", label: "User Rating" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary)_0%,_transparent_50%)] opacity-10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-accent)_0%,_transparent_50%)] opacity-10"></div>
      
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              OpenClip Pro
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-6"
          >
            <Link 
              to="/dashboard" 
              className="btn-glass px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            >
              Enter App
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center px-4 py-2 rounded-full glass-minimal border border-primary/20 text-sm font-medium"
                >
                  <Star className="w-4 h-4 mr-2 text-accent" />
                  AI-Powered Video Intelligence
                </motion.div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
                  Create
                  <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Viral Clips
                  </span>
                  <span className="block text-secondary">Instantly</span>
                </h1>
                
                <p className="text-xl text-subtle leading-relaxed max-w-xl">
                  Transform your long-form content into engaging short clips with AI-powered analysis. 
                  Perfect for YouTube Shorts, TikTok, Instagram Reels, and more.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/dashboard"
                  className="group bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/25 flex items-center justify-center"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="glass-frosted px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center">
                  <Download className="w-5 h-5 mr-2" />
                  Download App
                </button>
              </div>

              {/* Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-primary">{stat.number}</div>
                    <div className="text-sm text-subtle">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - Hero Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative flex items-center justify-center"
            >
              <LogoDisplay
                width={canvasSize.width}
                height={canvasSize.height}
                className="backdrop-blur-none"
                primaryColor="#4F46E5"
                secondaryColor="#06B6D4" 
                accentColor="#10B981"
                particleCount={240}
                animationSpeed={0.8}
                glowIntensity={1.2}
              />

              {/* Floating Elements */}
              <motion.div
                animate={{ 
                  y: [-10, 10, -10],
                  rotate: [0, 5, 0, -5, 0]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-8 -right-8 glass-minimal p-3 rounded-xl z-10"
              >
                <Sparkles className="w-6 h-6 text-accent" />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [10, -10, 10],
                  rotate: [0, -5, 0, 5, 0]
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -bottom-8 -left-8 glass-minimal p-3 rounded-xl z-10"
              >
                <Zap className="w-6 h-6 text-primary" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Powered by Advanced
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Technology
              </span>
            </h2>
            <p className="text-xl text-subtle max-w-3xl mx-auto">
              Our cutting-edge algorithms analyze video content, identify key moments, 
              and create optimized clips that maximize engagement and reach.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-300 group"
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

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-3xl"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Create
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Amazing Content?
              </span>
            </h2>
            <p className="text-xl text-subtle mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already using OpenClip Pro to transform 
              their content and grow their audience.
            </p>
            <Link 
              to="/dashboard"
              className="inline-flex items-center bg-gradient-to-r from-primary to-accent text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/25"
            >
              Start Creating Now
              <ArrowRight className="w-6 h-6 ml-3" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing; 