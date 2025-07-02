/**
 * Icon System Demo Component
 * Showcases the new Lucide React icon system with various features
 */

import React, { useState } from 'react';
import {
  Icon,
  DynamicIcon,
  IconTransition,
  PlayIcon,
  PauseIcon,
  VideoIcon,
  SettingsIcon,
  HeartIcon,
  StarIcon,
  LoaderIcon,
  BrainIcon,
  SparklesIcon,
  ZapIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  iconMap
} from '../icons';

const IconSystemDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorited, setFavorited] = useState(false);

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Icon 
            icon={BrainIcon} 
            size={48} 
            variant="brand" 
            animation="pulse" 
            className="mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold mb-2">New Icon System Demo</h1>
          <p className="text-slate-300">Lucide React with enhanced features</p>
        </div>

        {/* Basic Icons */}
        <section className="glass-panel p-6 rounded-xl mb-8 bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Icon icon={StarIcon} size={24} variant="warning" />
            Basic Icons
          </h2>
          <div className="grid grid-cols-6 gap-4">
            <Icon icon={VideoIcon} size={32} tooltip="Video" />
            <Icon icon={SettingsIcon} size={32} tooltip="Settings" />
            <Icon icon={HeartIcon} size={32} variant="destructive" tooltip="Favorite" />
            <Icon icon={CheckCircleIcon} size={32} variant="success" tooltip="Success" />
            <Icon icon={AlertCircleIcon} size={32} variant="warning" tooltip="Warning" />
            <Icon icon={SparklesIcon} size={32} variant="brand" tooltip="AI Magic" />
          </div>
        </section>

        {/* Interactive Icons */}
        <section className="glass-panel p-6 rounded-xl mb-8 bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Icon icon={ZapIcon} size={24} variant="brand" animation="scale" />
            Interactive Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Play/Pause Toggle */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Play/Pause Toggle</h3>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-all border border-blue-500/30"
              >
                <Icon 
                  icon={isPlaying ? PauseIcon : PlayIcon} 
                  size={24} 
                  animation="scale"
                  interactive
                />
              </button>
            </div>

            {/* Favorite with Badge */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Favorite with Badge</h3>
              <button
                onClick={() => setFavorited(!favorited)}
                className="p-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all border border-red-500/30"
              >
                <Icon 
                  icon={HeartIcon} 
                  size={24}
                  variant={favorited ? "destructive" : "muted"}
                  animation="bounce"
                  badge={favorited}
                  badgeContent="!"
                  interactive
                />
              </button>
            </div>

            {/* Loading State */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Loading State</h3>
              <div className="p-3 rounded-lg bg-slate-500/20 border border-slate-500/30">
                <Icon 
                  icon={LoaderIcon} 
                  size={24}
                  loading
                  variant="brand"
                />
              </div>
            </div>
          </div>
        </section>
        {/* Animation Showcase */}
        <section className="glass-panel p-6 rounded-xl mb-8 bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Icon icon={SparklesIcon} size={24} variant="brand" animation="rotate" />
            Animation Showcase
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Icon icon={LoaderIcon} size={32} animation="spin" variant="brand" />
              <p className="text-sm text-slate-400 mt-2">Spin</p>
            </div>
            
            <div className="text-center">
              <Icon icon={HeartIcon} size={32} animation="pulse" variant="destructive" />
              <p className="text-sm text-slate-400 mt-2">Pulse</p>
            </div>
            
            <div className="text-center">
              <Icon icon={StarIcon} size={32} animation="bounce" variant="warning" />
              <p className="text-sm text-slate-400 mt-2">Bounce</p>
            </div>
            
            <div className="text-center">
              <Icon icon={SparklesIcon} size={32} animation="fade" variant="brand" />
              <p className="text-sm text-slate-400 mt-2">Fade</p>
            </div>
          </div>
        </section>

        {/* Dynamic Icons */}
        <section className="glass-panel p-6 rounded-xl mb-8 bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Icon icon={SettingsIcon} size={24} variant="muted" animation="rotate" />
            Dynamic Icon Loading
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <DynamicIcon 
                name="play" 
                iconMap={iconMap} 
                size={24}
                variant="brand"
                fallback={VideoIcon}
              />
              <span>Dynamic icon: "play"</span>
            </div>
            
            <div className="flex items-center gap-4">
              <DynamicIcon 
                name="brain" 
                iconMap={iconMap} 
                size={24}
                variant="brand"
                animation="pulse"
                fallback={VideoIcon}
              />
              <span>Dynamic icon: "brain" with pulse animation</span>
            </div>
          </div>
        </section>

        {/* Icon Transitions */}
        <section className="glass-panel p-6 rounded-xl mb-8 bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <IconTransition 
              icons={[PlayIcon, PauseIcon, VideoIcon]} 
              interval={1500}
              size={24}
              variant="brand"
            />
            Icon Transitions
          </h2>
          
          <div className="text-center">
            <IconTransition 
              icons={[BrainIcon, SparklesIcon, ZapIcon, StarIcon]} 
              interval={2000}
              size={48}
              variant="brand"
            />
            <p className="text-slate-400 mt-4">AI-themed icon rotation</p>
          </div>
        </section>

        {/* Performance Benefits */}
        <section className="glass-panel p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Icon icon={ZapIcon} size={24} variant="success" />
            Performance Benefits
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <Icon icon={CheckCircleIcon} size={24} variant="success" className="mb-2" />
              <h3 className="font-semibold text-green-400">Bundle Size</h3>
              <p className="text-sm text-slate-300">75% smaller than Framer icons</p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
              <Icon icon={ZapIcon} size={24} variant="brand" className="mb-2" />
              <h3 className="font-semibold text-blue-400">Performance</h3>
              <p className="text-sm text-slate-300">Optimized CSS animations</p>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
              <Icon icon={BrainIcon} size={24} variant="brand" className="mb-2" />
              <h3 className="font-semibold text-purple-400">Developer Experience</h3>
              <p className="text-sm text-slate-300">TypeScript support & IntelliSense</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-400">
          <Icon icon={SparklesIcon} size={20} variant="brand" animation="pulse" className="inline mr-2" />
          Powered by Lucide React & Custom Icon System
        </div>
      </div>
    </div>
  );
};

export default IconSystemDemo;