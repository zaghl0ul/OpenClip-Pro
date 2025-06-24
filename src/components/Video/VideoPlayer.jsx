import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, AlertOctagon } from 'lucide-react';

const VideoPlayer = forwardRef(({ videoUrl, projectId, showControls = true, autoPlay = false, onProgress, onDuration, className = '' }, ref) => {
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actualVideoUrl, setActualVideoUrl] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  
  // Memoize the functions used in useImperativeHandle to prevent infinite loops
  const seekTo = useCallback((seconds) => {
    // Validate the seconds parameter to prevent HTMLMediaElement errors
    if (playerRef.current && 
        typeof seconds === 'number' && 
        !isNaN(seconds) && 
        isFinite(seconds) && 
        seconds >= 0) {
      playerRef.current.seekTo(seconds);
    } else {
      console.warn('Invalid seek time:', seconds);
    }
  }, []);
  
  const getCurrentTime = useCallback(() => currentTime, []);
  
  const getDuration = useCallback(() => duration, []);
  
  const play = useCallback(() => setPlaying(true), []);
  
  const pause = useCallback(() => setPlaying(false), []);

  // Expose methods to parent components with memoized functions
  useImperativeHandle(ref, () => ({
    seekTo,
    getCurrentTime,
    getDuration,
    play,
    pause
  }), [seekTo, getCurrentTime, getDuration, play, pause]);

  // Fetch video URL and thumbnail from backend when using projectId (memoized to prevent excessive calls)
  useEffect(() => {
    let isMounted = true;
    
    const fetchVideoData = async () => {
      if (!projectId || (videoUrl?.startsWith('blob:') || videoUrl?.startsWith('http'))) {
        if (isMounted) setActualVideoUrl(videoUrl);
        return;
      }

      try {
        // First get project data (includes thumbnail)
        const projectResponse = await fetch(`http://localhost:8001/api/projects/${projectId}`);
        if (!isMounted) return;
        
        const projectData = await projectResponse.json();
        
        if (isMounted) {
          // Check for thumbnail in different possible locations
          const thumbnail = projectData.project?.thumbnail_url || 
                           projectData.project?.video_data?.thumbnail_url;
          
          if (thumbnail) {
            setThumbnailUrl(`http://localhost:8001${thumbnail}`);
          }
        }
        
        // Then get video stream URL
        const streamResponse = await fetch(`http://localhost:8001/api/projects/${projectId}/stream`);
        if (!isMounted) return;
        
        const streamData = await streamResponse.json();
        
        if (isMounted) {
          if (streamData.video_url) {
            // Check if URL already has base URL
            const videoUrl = streamData.video_url.startsWith('http') 
              ? streamData.video_url 
              : `http://localhost:8001${streamData.video_url}`;
            setActualVideoUrl(videoUrl);
          } else {
            setError('No video URL available');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch video data');
          console.error('Video fetch error:', err);
        }
      }
    };

    fetchVideoData();
    
    return () => {
      isMounted = false;
    };
  }, [projectId, videoUrl]); // Keep videoUrl in dependencies but handle it properly in the effect

  // Memoized video source to prevent excessive re-calculations
  const videoSource = useMemo(() => {
    if (videoUrl?.startsWith('blob:') || videoUrl?.startsWith('http')) {
      return videoUrl;
    }
    
    if (actualVideoUrl) {
      return actualVideoUrl;
    }
    
    return null;
  }, [videoUrl, actualVideoUrl]);

  const handleProgress = useCallback((state) => {
    setCurrentTime(state.playedSeconds);
    if (onProgress) onProgress(state);
  }, [onProgress]);

  const handleDuration = useCallback((duration) => {
    setDuration(duration);
    if (onDuration) onDuration(duration);
  }, [onDuration]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, []);

  const handleSeek = useCallback((e) => {
    const progressBar = e.currentTarget;
    const bounds = progressBar.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percent = x / bounds.width;
    const seekTo = percent * duration;

    if (playerRef.current) {
      playerRef.current.seekTo(seekTo);
    }
  }, [duration]);

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(currentTime + 10, duration);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime);
    }
  }, [currentTime, duration]);

  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(currentTime - 10, 0);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime);
    }
  }, [currentTime, duration]);

  // Update playing state when autoPlay prop changes
  useEffect(() => {
    setPlaying(autoPlay);
  }, [autoPlay]);

  // Memoize the keyboard event handler to prevent re-creating it on every render
  const handleKeyPress = useCallback((e) => {
    // Only handle events when this player is focused or no specific element is focused
    if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) {
      return;
    }

    switch (e.code) {
      case 'Space':
        setPlaying(prev => !prev);
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (playerRef.current) {
          const newTime = Math.min(currentTime + 10, duration);
          playerRef.current.seekTo(newTime);
        }
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (playerRef.current) {
          const newTime = Math.max(currentTime - 10, 0);
          playerRef.current.seekTo(newTime);
        }
        e.preventDefault();
        break;
      case 'KeyM':
        setMuted(prev => !prev);
        e.preventDefault();
        break;
      case 'KeyF':
        if (containerRef.current) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            containerRef.current.requestFullscreen();
          }
        }
        e.preventDefault();
        break;
      default:
        break;
    }
  }, [currentTime, duration]);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div 
      ref={containerRef}
      className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className} glass-prism`}
      tabIndex={0} // Make div focusable
    >
      {videoSource ? (
        <ReactPlayer
          ref={playerRef}
          url={videoSource}
          playing={playing}
          volume={volume}
          muted={muted}
          controls={false}
          width="100%"
          height="100%"
          onReady={() => setLoading(false)}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onError={(e) => {
            console.error('❌ Video playback error:', e);
            console.error('❌ Failed video source:', videoSource);
            console.error('❌ Error details:', e.target?.error);
            setError('Failed to load video. Please check your connection or try another video file.');
            setLoading(false);
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          {thumbnailUrl ? (
            <div className="relative w-full h-full">
              <img 
                src={thumbnailUrl} 
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="text-center">
                  <AlertOctagon className="w-10 h-10 text-red-500 mb-2 mx-auto" />
                  <p className="text-white">Video source unavailable</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <AlertOctagon className="w-10 h-10 text-red-500 mb-2 mx-auto" />
              <p className="text-white">Video source unavailable</p>
            </div>
          )}
        </div>
      )}

      {/* Thumbnail overlay when not playing */}
      {!playing && !loading && thumbnailUrl && videoSource && (
        <div className="absolute inset-0 cursor-pointer" onClick={() => setPlaying(true)}>
          <img 
            src={thumbnailUrl} 
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <AlertOctagon className="w-10 h-10 text-red-500 mb-2" />
          <p className="text-white">{error}</p>
        </div>
      )}

      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
          <div className="space-y-2">
            <div 
              className="w-full h-2 bg-white/30 rounded-full cursor-pointer glass-shine"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlaying(!playing)}
                  className="p-2 rounded-full text-white hover:bg-white/20 transition-colors glass-shine"
                >
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={handleSkipBackward}
                  className="p-2 rounded-full text-white hover:bg-white/20 transition-colors glass-shine"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleSkipForward}
                  className="p-2 rounded-full text-white hover:bg-white/20 transition-colors glass-shine"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setMuted(!muted)}
                  className="p-2 rounded-full text-white hover:bg-white/20 transition-colors glass-shine"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                <span className="text-white text-sm glass-shine px-2 py-1 rounded-md">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              <div>
                <button
                  onClick={handleFullscreen}
                  className="p-2 rounded-full text-white hover:bg-white/20 transition-colors glass-shine"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;