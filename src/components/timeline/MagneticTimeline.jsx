import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, 
  Scissors, Layers 
} from 'lucide-react';

const MagneticTimeline = ({ 
  duration = 0, 
  currentTime = 0, 
  onTimeChange,
  onSplit,
  playing = false,
  onPlayPause
}) => {
  const timelineRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const playheadPosition = useSpring(currentTime, { stiffness: 400, damping: 40 });
  const playheadPercent = useTransform(playheadPosition, [0, duration], [0, 100]);
  
  // Generate simple waveform visualization
  const generateWaveformData = useCallback(() => {
    const points = 100;
    const data = [];
    for (let i = 0; i < points; i++) {
      data.push(Math.random() * 0.8 + 0.2);
    }
    return data;
  }, []);
  
  const [waveformData] = useState(generateWaveformData);
  
  // Handle timeline click/drag
  const handleMouseDown = useCallback((e) => {
    if (!timelineRef.current || duration === 0) return;
    
    setIsDragging(true);
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mousePercent = (mouseX / rect.width) * 100;
    const targetTime = (mousePercent / 100) * duration;
    
    playheadPosition.set(targetTime);
    onTimeChange?.(targetTime);
  }, [duration, playheadPosition, onTimeChange]);
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !timelineRef.current || duration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const mousePercent = (mouseX / rect.width) * 100;
    const targetTime = (mousePercent / 100) * duration;
    
    playheadPosition.set(targetTime);
    onTimeChange?.(targetTime);
  }, [isDragging, duration, playheadPosition, onTimeChange]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Update playhead position when currentTime changes
  useEffect(() => {
    if (!isDragging) {
      playheadPosition.set(currentTime);
    }
  }, [currentTime, isDragging, playheadPosition]);
  
  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas.getBoundingClientRect();
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = width / waveformData.length;
    const centerY = height / 2;
    
    ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
    
    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * centerY * 0.8;
      ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);
    });
  }, [waveformData]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10);
    onTimeChange?.(newTime);
  };
  
  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    onTimeChange?.(newTime);
  };
  
  return (
    <div className="glass-minimal rounded-2xl p-6 space-y-6">
      <div className="relative z-10">
        {/* Timeline Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Timeline</h3>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/40">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Transport Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <motion.button
            className="glass-minimal rounded-xl p-3 text-white hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSkipBack}
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlayPause}
          >
            {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </motion.button>
          
          <motion.button
            className="glass-minimal rounded-xl p-3 text-white hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSkipForward}
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>
          
          <div className="ml-8 flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-white/60" />
            <div className="w-24 h-2 glass-minimal rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400" style={{ width: '75%' }} />
            </div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="relative">
          <div
            ref={timelineRef}
            className="relative h-32 glass-minimal rounded-xl overflow-hidden cursor-pointer"
            onMouseDown={handleMouseDown}
          >
            {/* Waveform */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full opacity-50"
              style={{ width: '100%', height: '100%' }}
            />
            
            {/* Time markers */}
            {duration > 0 && (
              <div className="absolute top-2 left-0 right-0 flex justify-between text-xs text-white/40 px-4">
                {Array.from({ length: Math.min(9, Math.floor(duration / 10) + 1) }, (_, i) => (
                  <span key={i}>{formatTime((duration / (Math.min(8, Math.floor(duration / 10)))) * i)}</span>
                ))}
              </div>
            )}
            
            {/* Playhead */}
            {duration > 0 && (
              <motion.div
                className="absolute top-0 bottom-0 pointer-events-none z-10"
                style={{ left: playheadPercent.get() + '%' }}
              >
                <div className="w-0.5 h-full bg-white shadow-lg" />
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Timeline Tools */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <motion.button
              className="glass-minimal px-4 py-2 rounded-xl text-white hover:bg-white/20 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSplit?.(currentTime)}
              disabled={duration === 0}
            >
              <Scissors className="w-4 h-4" />
              Split
            </motion.button>
            
            <motion.button
              className="glass-minimal px-4 py-2 rounded-xl text-white hover:bg-white/20 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={duration === 0}
            >
              <Layers className="w-4 h-4" />
              Layers
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagneticTimeline;