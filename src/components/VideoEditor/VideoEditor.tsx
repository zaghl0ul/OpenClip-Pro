import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, PauseIcon, ScissorsIcon, SkipBackIcon, SkipForwardIcon,
  Volume2Icon, VolumeXIcon, MaximizeIcon, LayersIcon, ZapIcon,
  DownloadIcon, SaveIcon, RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon,
  SparklesIcon, Grid3X3Icon, ClockIcon, ActivityIcon, EyeIcon
} from '../Common/icons';
import { useProjectStore } from '../../stores/projectStore';
import { useClipStore } from '../../stores/clipStore';
import toast from 'react-hot-toast';
import VideoTimeline from './VideoTimeline';
import ClipSegmentEditor from './ClipSegmentEditor';
import VideoPreview from './VideoPreview';
import AIClipSuggestions from './AIClipSuggestions';
import { formatTime } from '../../utils/formatters';

export interface VideoEditorProps {
  projectId: string;
  videoUrl: string;
  onClipsGenerated?: (clips: any[]) => void;
}

interface ClipSegment {
  id: string;
  startTime: number;
  endTime: number;
  type: 'highlight' | 'scene' | 'custom' | 'ai_suggested';
  title: string;
  selected: boolean;
  metadata?: any;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ 
  projectId, 
  videoUrl,
  onClipsGenerated 
}) => {
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Editor state
  const [segments, setSegments] = useState<ClipSegment[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [editMode, setEditMode] = useState<'select' | 'trim' | 'split'>('select');
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Store hooks
  const { generateClips, analyzeVideo } = useProjectStore();
  const { addClips } = useClipStore();

  // Initialize video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Video event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Segment management
  const addSegment = useCallback((startTime: number, endTime: number, type: ClipSegment['type'] = 'custom') => {
    const newSegment: ClipSegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime,
      endTime,
      type,
      title: `Clip ${segments.length + 1}`,
      selected: false,
    };
    
    setSegments([...segments, newSegment]);
    toast.success('Segment added');
  }, [segments]);

  const updateSegment = useCallback((segmentId: string, updates: Partial<ClipSegment>) => {
    setSegments(segments.map(seg => 
      seg.id === segmentId ? { ...seg, ...updates } : seg
    ));
  }, [segments]);

  const deleteSegment = useCallback((segmentId: string) => {
    setSegments(segments.filter(seg => seg.id !== segmentId));
    setSelectedSegments(selectedSegments.filter(id => id !== segmentId));
    if (activeSegment === segmentId) {
      setActiveSegment(null);
    }
    toast.success('Segment deleted');
  }, [segments, selectedSegments, activeSegment]);

  const toggleSegmentSelection = useCallback((segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  }, []);

  const selectAllSegments = useCallback(() => {
    setSelectedSegments(segments.map(seg => seg.id));
  }, [segments]);

  const deselectAllSegments = useCallback(() => {
    setSelectedSegments([]);
  }, []);

  // Split video at current time
  const splitAtPlayhead = useCallback(() => {
    const overlappingSegment = segments.find(seg => 
      currentTime > seg.startTime && currentTime < seg.endTime
    );

    if (overlappingSegment) {
      // Split existing segment
      const newSegment: ClipSegment = {
        id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: currentTime,
        endTime: overlappingSegment.endTime,
        type: overlappingSegment.type,
        title: `${overlappingSegment.title} (Split)`,
        selected: false,
      };

      updateSegment(overlappingSegment.id, { endTime: currentTime });
      setSegments([...segments, newSegment]);
      toast.success('Segment split');
    } else {
      // Create new segment from current time to next segment or end
      const nextSegment = segments
        .filter(seg => seg.startTime > currentTime)
        .sort((a, b) => a.startTime - b.startTime)[0];

      const endTime = nextSegment ? nextSegment.startTime : Math.min(currentTime + 10, duration);
      
      addSegment(currentTime, endTime, 'custom');
    }
  }, [currentTime, segments, duration, addSegment, updateSegment]);

  // Mark in/out points for creating segments
  const [markIn, setMarkIn] = useState<number | null>(null);
  
  const handleMarkIn = useCallback(() => {
    setMarkIn(currentTime);
    toast.success(`Mark in: ${formatTime(currentTime)}`);
  }, [currentTime]);

  const handleMarkOut = useCallback(() => {
    if (markIn !== null && currentTime > markIn) {
      addSegment(markIn, currentTime);
      setMarkIn(null);
      toast.success('Segment created from marks');
    } else {
      toast.error('Set mark in point first');
    }
  }, [markIn, currentTime, addSegment]);

  // AI-powered clip detection
  const detectScenes = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await analyzeVideo(projectId, 'detect_scenes');
      
      if (response.scenes) {
        const newSegments = response.scenes.map((scene: any, index: number) => ({
          id: `scene-${Date.now()}-${index}`,
          startTime: scene.start_time,
          endTime: scene.end_time,
          type: 'scene' as const,
          title: `Scene ${index + 1}`,
          selected: false,
          metadata: scene.metadata,
        }));
        
        setSegments([...segments, ...newSegments]);
        toast.success(`Detected ${newSegments.length} scenes`);
      }
    } catch (error) {
      toast.error('Scene detection failed');
    } finally {
      setIsGenerating(false);
    }
  }, [projectId, segments, analyzeVideo]);

  const detectHighlights = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await analyzeVideo(projectId, 'detect_highlights', {
        duration_target: 60,
        min_clip_length: 5,
        max_clip_length: 15,
      });
      
      if (response.highlights) {
        const newSegments = response.highlights.map((highlight: any, index: number) => ({
          id: `highlight-${Date.now()}-${index}`,
          startTime: highlight.start_time,
          endTime: highlight.end_time,
          type: 'highlight' as const,
          title: `Highlight ${index + 1}`,
          selected: false,
          metadata: {
            score: highlight.score,
            ...highlight.metadata,
          },
        }));
        
        setSegments([...segments, ...newSegments]);
        toast.success(`Found ${newSegments.length} highlights`);
      }
    } catch (error) {
      toast.error('Highlight detection failed');
    } finally {
      setIsGenerating(false);
    }
  }, [projectId, segments, analyzeVideo]);

  // Generate clips from segments
  const handleGenerateClips = useCallback(async () => {
    const segmentsToGenerate = selectedSegments.length > 0
      ? segments.filter(seg => selectedSegments.includes(seg.id))
      : segments;

    if (segmentsToGenerate.length === 0) {
      toast.error('No segments to generate');
      return;
    }

    setIsGenerating(true);
    try {
      const clipData = segmentsToGenerate.map(seg => ({
        start_time: seg.startTime,
        end_time: seg.endTime,
        clip_type: seg.type,
        title: seg.title,
        metadata: seg.metadata,
      }));

      const response = await generateClips(projectId, {
        segments: clipData,
        options: {
          quality: 'high',
          add_captions: false,
          add_watermark: false,
          transition_duration: 0.5,
        },
      });

      if (response.clips) {
        addClips(response.clips);
        toast.success(`Generated ${response.clips.length} clips`);
        
        if (onClipsGenerated) {
          onClipsGenerated(response.clips);
        }
      }
    } catch (error) {
      toast.error('Clip generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSegments, segments, projectId, generateClips, addClips, onClipsGenerated]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        case 'i':
          e.preventDefault();
          handleMarkIn();
          break;
        case 'o':
          e.preventDefault();
          handleMarkOut();
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            splitAtPlayhead();
          }
          break;
        case 'Delete':
          if (activeSegment) {
            deleteSegment(activeSegment);
          }
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            selectAllSegments();
          }
          break;
        case 'Escape':
          deselectAllSegments();
          setActiveSegment(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    handlePlayPause, 
    handleSeek, 
    currentTime, 
    duration, 
    handleMarkIn, 
    handleMarkOut,
    splitAtPlayhead, 
    activeSegment, 
    deleteSegment, 
    selectAllSegments, 
    deselectAllSegments
  ]);

  // Calculate timeline position
  const timelinePosition = useMemo(() => {
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden"
    >
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setEditMode('select')}
            className={`p-2 rounded transition-colors ${
              editMode === 'select' 
                ? 'bg-primary text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Select mode"
          >
            <LayersIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setEditMode('trim')}
            className={`p-2 rounded transition-colors ${
              editMode === 'trim' 
                ? 'bg-primary text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Trim mode"
          >
            <ScissorsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setEditMode('split')}
            className={`p-2 rounded transition-colors ${
              editMode === 'split' 
                ? 'bg-primary text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Split mode"
          >
            <Grid3X3Icon className="w-5 h-5" />
          </button>
          
          <div className="h-8 w-px bg-gray-700" />
          
          <button
            onClick={detectScenes}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <ActivityIcon className="w-4 h-4" />
            <span>Detect Scenes</span>
          </button>
          
          <button
            onClick={detectHighlights}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Find Highlights</span>
          </button>
          
          <button
            onClick={() => setShowAISuggestions(!showAISuggestions)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            <ZapIcon className="w-4 h-4" />
            <span>AI Suggestions</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            {selectedSegments.length > 0 && `${selectedSegments.length} selected`}
          </span>
          
          <button
            onClick={handleGenerateClips}
            disabled={isGenerating || segments.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCwIcon className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4" />
                <span>Generate Clips</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Preview */}
        <div className="flex-1 flex flex-col">
          <VideoPreview
            videoRef={videoRef}
            videoUrl={videoUrl}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            segments={segments}
            activeSegment={activeSegment}
          />
          
          {/* Playback Controls */}
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="p-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                >
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </button>
                
                <button
                  onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                  className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  <SkipBackIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
                  className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  <SkipForwardIcon className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeXIcon className="w-5 h-5" />
                    ) : (
                      <Volume2Icon className="w-5 h-5" />
                    )}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20"
                  />
                </div>
                
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <MaximizeIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Mark In/Out Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleMarkIn}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Mark In (I)
              </button>
              
              {markIn !== null && (
                <span className="text-sm text-gray-400">
                  In: {formatTime(markIn)}
                </span>
              )}
              
              <button
                onClick={handleMarkOut}
                disabled={markIn === null}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Mark Out (O)
              </button>
              
              <button
                onClick={splitAtPlayhead}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Split (Ctrl+S)
              </button>
            </div>
          </div>
        </div>
        
        {/* Side Panel */}
        <AnimatePresence>
          {(showAISuggestions || activeSegment) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-gray-800 border-l border-gray-700 overflow-hidden"
            >
              {showAISuggestions ? (
                <AIClipSuggestions
                  projectId={projectId}
                  onAddSegment={(start, end, type) => addSegment(start, end, 'ai_suggested')}
                  onClose={() => setShowAISuggestions(false)}
                />
              ) : activeSegment && (
                <ClipSegmentEditor
                  segment={segments.find(s => s.id === activeSegment)!}
                  onUpdate={(updates) => updateSegment(activeSegment, updates)}
                  onDelete={() => deleteSegment(activeSegment)}
                  onClose={() => setActiveSegment(null)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Timeline */}
      <div 
        ref={timelineRef}
        className="h-48 bg-gray-800 border-t border-gray-700 overflow-x-auto"
      >
        <VideoTimeline
          duration={duration}
          currentTime={currentTime}
          segments={segments}
          selectedSegments={selectedSegments}
          activeSegment={activeSegment}
          zoom={timelineZoom}
          onSeek={handleSeek}
          onSegmentSelect={(segmentId) => {
            if (editMode === 'select') {
              toggleSegmentSelection(segmentId);
            }
            setActiveSegment(segmentId);
          }}
          onSegmentUpdate={updateSegment}
          onSegmentDelete={deleteSegment}
          onZoomChange={setTimelineZoom}
          editMode={editMode}
          markIn={markIn}
        />
      </div>
    </div>
  );
};

export default VideoEditor;