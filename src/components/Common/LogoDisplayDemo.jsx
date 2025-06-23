import React, { useState } from 'react';
import LogoDisplay from './LogoDisplay';
import { Palette, Settings, Zap, Sparkles } from 'lucide-react';

const LogoDisplayDemo = () => {
  const [config, setConfig] = useState({
    width: 700,
    height: 500,
    primaryColor: '#4F46E5',
    secondaryColor: '#06B6D4',
    accentColor: '#10B981',
    particleCount: 240,
    animationSpeed: 0.8,
    glowIntensity: 1.2
  });

  const presets = [
    {
      name: 'Ocean Blue',
      colors: { primaryColor: '#1E40AF', secondaryColor: '#0EA5E9', accentColor: '#06B6D4' }
    },
    {
      name: 'Neon Pink',
      colors: { primaryColor: '#EC4899', secondaryColor: '#F97316', accentColor: '#EF4444' }
    },
    {
      name: 'Forest Green',
      colors: { primaryColor: '#059669', secondaryColor: '#10B981', accentColor: '#34D399' }
    },
    {
      name: 'Purple Magic',
      colors: { primaryColor: '#7C3AED', secondaryColor: '#A855F7', accentColor: '#C084FC' }
    },
    {
      name: 'Solar Orange',
      colors: { primaryColor: '#EA580C', secondaryColor: '#F97316', accentColor: '#FB923C' }
    }
  ];

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset) => {
    setConfig(prev => ({ ...prev, ...preset.colors }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LogoDisplay Customization Demo
          </h1>
          <p className="text-subtle text-lg">
            Explore all the customization options for the animated OPENCLIP PRO logo with 24 flowing gradient lines and multi-layered 3D depth
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Logo Display */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-center">
                <LogoDisplay {...config} />
              </div>
              
              {/* Size Controls */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Size Controls
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Width: {config.width}px</label>
                    <input
                      type="range"
                      min="500"
                      max="1000"
                      value={config.width}
                      onChange={(e) => updateConfig('width', parseInt(e.target.value))}
                      className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Height: {config.height}px</label>
                    <input
                      type="range"
                      min="400"
                      max="800"
                      value={config.height}
                      onChange={(e) => updateConfig('height', parseInt(e.target.value))}
                      className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Color Presets */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Color Presets
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="p-3 rounded-lg glass-minimal hover:glass-frosted transition-all duration-300 text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{preset.name}</span>
                      <div className="flex space-x-1">
                        {Object.values(preset.colors).map((color, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4">Custom Colors</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border-2 border-surface cursor-pointer"
                    />
                    <span className="text-sm font-mono">{config.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Secondary Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border-2 border-surface cursor-pointer"
                    />
                    <span className="text-sm font-mono">{config.secondaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Accent Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => updateConfig('accentColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border-2 border-surface cursor-pointer"
                    />
                    <span className="text-sm font-mono">{config.accentColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Animation Controls */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Animation Controls
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Animation Speed: {config.animationSpeed}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={config.animationSpeed}
                    onChange={(e) => updateConfig('animationSpeed', parseFloat(e.target.value))}
                    className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Particle Count: {config.particleCount}
                  </label>
                  <p className="text-xs text-subtle mb-2">
                    Particles across 5 depth layers: Background, Deep, Middle, Additional & Prominent white
                  </p>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    step="20"
                    value={config.particleCount}
                    onChange={(e) => updateConfig('particleCount', parseInt(e.target.value))}
                    className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Glow Intensity: {Math.round(config.glowIntensity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.glowIntensity}
                    onChange={(e) => updateConfig('glowIntensity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Code Export */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Export Code
              </h3>
              <div className="bg-black/50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre className="text-green-400">
{`<LogoDisplay
  width={${config.width}}
  height={${config.height}}
  primaryColor="${config.primaryColor}"
  secondaryColor="${config.secondaryColor}"
  accentColor="${config.accentColor}"
  particleCount={${config.particleCount}}
  animationSpeed={${config.animationSpeed}}
  glowIntensity={${config.glowIntensity}}
/>`}
                </pre>
              </div>
              <button
                onClick={() => {
                  const code = `<LogoDisplay
  width={${config.width}}
  height={${config.height}}
  primaryColor="${config.primaryColor}"
  secondaryColor="${config.secondaryColor}"
  accentColor="${config.accentColor}"
  particleCount={${config.particleCount}}
  animationSpeed={${config.animationSpeed}}
  glowIntensity={${config.glowIntensity}}
/>`;
                  navigator.clipboard.writeText(code);
                }}
                className="mt-3 w-full bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-lg font-medium hover:scale-105 transition-transform"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoDisplayDemo; 