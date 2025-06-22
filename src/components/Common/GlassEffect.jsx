import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Layers, Palette, Hexagon, Circle, Square, Triangle, Star, Zap } from 'lucide-react'
import { getCurrentTheme } from '../../config/themes'

/**
 * GlassEffect - A component to toggle and manage enhanced glass UI effects
 * throughout the application
 */
const GlassEffect = () => {
  const [showDemo, setShowDemo] = useState(false)
  const [activeEffect, setActiveEffect] = useState('glass')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const currentTheme = getCurrentTheme()
  
  const glassEffects = [
    {
      name: 'glass',
      label: 'Standard Glass',
      description: 'Classic frosted glass with subtle depth',
      icon: Square,
      color: 'text-blue-400'
    },
    {
      name: 'glass-card',
      label: 'Premium Card',
      description: 'Enhanced depth with stronger blur and shadows',
      icon: Layers,
      color: 'text-purple-400'
    },
    {
      name: 'glass-panel',
      label: 'Minimal Panel',
      description: 'Ultra-light touch with minimal blur',
      icon: Circle,
      color: 'text-green-400'
    },
    {
      name: 'glass-frosted',
      label: 'Frosted Transform',
      description: 'Dramatic hover effect from clear to frosted',
      icon: Hexagon,
      color: 'text-cyan-400'
    },
    {
      name: 'glass-prism',
      label: 'Prism Edge',
      description: 'Black glass with vivid rainbow refraction',
      icon: Triangle,
      color: 'text-pink-400'
    },
    {
      name: 'glass-shine',
      label: 'Mirror Shine',
      description: 'Reflective surface with animated light sweep',
      icon: Star,
      color: 'text-yellow-400'
    },
    {
      name: 'glass-minimal',
      label: 'Ultra Minimal',
      description: 'Barely-there glass for subtle UI elements',
      icon: Zap,
      color: 'text-orange-400'
    }
  ]
  
  useEffect(() => {
    // Show demo on first visit
    const hasSeenDemo = localStorage.getItem('glass-effect-demo-seen')
    if (!hasSeenDemo && window.location.pathname === '/dashboard') {
      setTimeout(() => {
        setShowDemo(true)
        localStorage.setItem('glass-effect-demo-seen', 'true')
      }, 2000)
    }

    // Track mouse position for interactive effects
    const handleMouseMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePosition({ x, y })
    }

    const demoArea = document.getElementById('glass-demo-area')
    if (demoArea) {
      demoArea.addEventListener('mousemove', handleMouseMove)
      return () => demoArea.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])
  
  if (!showDemo) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowDemo(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Glass Effects Showcase</h2>
                  <p className="text-sm text-subtle">Theme: {currentTheme}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemo(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Effect Selector */}
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {glassEffects.map(({ name, label, icon: Icon, color }) => (
                  <button
                    key={name}
                    onClick={() => setActiveEffect(name)}
                    className={`
                      p-3 rounded-lg transition-all duration-200
                      ${activeEffect === name 
                        ? `glass-card border-primary shadow-lg scale-105 ${color}`
                        : 'glass-minimal hover:glass-panel'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-2 ${activeEffect === name ? color : 'text-subtle'}`} />
                    <span className="text-xs font-medium block">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Interactive Demo Area */}
            <div id="glass-demo-area" className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 p-8">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 50%, var(--color-primary) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, var(--color-accent) 0%, transparent 50%),
                    radial-gradient(circle at 40% 20%, var(--color-gradientEnd) 0%, transparent 50%)
                  `
                }} />
              </div>

              {/* Main Demo Card */}
              <motion.div
                layout
                className={`
                  relative ${activeEffect} p-8 mx-auto max-w-md
                  ${activeEffect === 'glass-prism' ? 'hover-prism-edge' : ''}
                `}
                style={{
                  '--glow-x': `${mousePosition.x}%`,
                  '--glow-y': `${mousePosition.y}%`,
                  '--glow-opacity': activeEffect === 'glass' || activeEffect === 'glass-card' ? 1 : 0,
                  '--edge-x': `${mousePosition.x}%`,
                  '--edge-y': `${mousePosition.y}%`,
                  '--edge-intensity': activeEffect === 'glass-prism' ? 0.8 : 0,
                  '--shine-x': `${mousePosition.x}%`,
                  '--shine-y': `${mousePosition.y}%`,
                }}
              >
                <div className="flex items-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary mr-3" />
                  <h3 className="text-xl font-semibold">
                    {glassEffects.find(e => e.name === activeEffect)?.label}
                  </h3>
                </div>
                
                <p className="text-subtle mb-6">
                  {glassEffects.find(e => e.name === activeEffect)?.description}
                </p>

                <div className="space-y-3">
                  <div className="glass-minimal p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hover me to see the effect</span>
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-minimal p-2 rounded text-center">
                        <span className="text-xs text-subtle">Item {i}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Effect-specific visual indicators */}
                {activeEffect === 'glass-prism' && (
                  <div className="absolute -inset-1 opacity-50 pointer-events-none">
                    <div className="absolute inset-0 rounded-lg animate-pulse"
                      style={{
                        background: 'conic-gradient(from 0deg, #ff0080, #0080ff, #00ff80, #ff0080)',
                        filter: 'blur(20px)',
                      }}
                    />
                  </div>
                )}

                {activeEffect === 'glass-shine' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                    <div className="absolute inset-0 opacity-30"
                      style={{
                        background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.7) 50%, transparent 60%)`,
                        transform: `translateX(${mousePosition.x - 50}%)`,
                      }}
                    />
                  </div>
                )}
              </motion.div>

              {/* Feature Highlights */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">Dynamic</div>
                  <p className="text-sm text-subtle">Mouse-aware interactions</p>
                </div>
                <div className="glass-panel p-4 text-center">
                  <div className="text-2xl font-bold text-accent mb-1">Performant</div>
                  <p className="text-sm text-subtle">GPU-accelerated effects</p>
                </div>
                <div className="glass-panel p-4 text-center">
                  <div className="text-2xl font-bold text-success mb-1">Adaptive</div>
                  <p className="text-sm text-subtle">Theme-aware styling</p>
                </div>
              </div>
            </div>
            
            {/* Tips */}
            <div className="mt-8 glass-panel p-4 space-y-2">
              <h4 className="font-medium text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Pro Tips
              </h4>
              <ul className="text-sm text-subtle space-y-1 list-disc list-inside">
                <li>Glass effects adapt to your chosen theme automatically</li>
                <li>Hover over elements to see interactive effects</li>
                <li>Use glass-minimal for performance-critical areas</li>
                <li>Combine with btn-glass for consistent button styling</li>
                <li>The prism effect works best on dark themes</li>
              </ul>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-subtle">
                Press ESC or click outside to close
              </p>
              <button
                onClick={() => setShowDemo(false)}
                className="btn btn-primary"
              >
                Got it!
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Helper component for prism edge effect
const PrismEdge = ({ className }) => (
  <style jsx>{`
    .hover-prism-edge:hover {
      --edge-intensity: 0.8;
    }
  `}</style>
)

export default GlassEffect 