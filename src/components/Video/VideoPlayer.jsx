import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, AlertOctagon } from 'lucide-react';

const VideoPlayer = ({ videoUrl, projectId, showControls = true, autoPlay = false, onProgress, onDuration, className = '' }) => {
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  // Handle backend URLs vs local URLs
  const videoSource = videoUrl?.startsWith('blob:') || videoUrl?.startsWith('http')
    ? videoUrl
    : projectId ? `/api/projects/${projectId}/stream` : null;

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);
    if (onProgress) onProgress(state);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
    if (onDuration) onDuration(duration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleSeek = (e) => {
    const progressBar = e.currentTarget;
    const bounds = progressBar.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percent = x / bounds.width;
    const seekTo = percent * duration;

    playerRef.current?.seekTo(seekTo);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 10, duration);
    playerRef.current?.seekTo(newTime);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    playerRef.current?.seekTo(newTime);
  };

  useEffect(() => {
    setPlaying(autoPlay);
  }, [autoPlay, videoUrl]);

  useEffect(() => {
    const handleKeyPress = (e) => {
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
          handleSkipForward();
          e.preventDefault();
          break;
        case 'ArrowLeft':
          handleSkipBackward();
          e.preventDefault();
          break;
        case 'KeyM':
          setMuted(prev => !prev);
          e.preventDefault();
          break;
        case 'KeyF':
          handleFullscreen();
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentTime, duration]);

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
            console.error('Video playback error:', e);
            setError('Failed to load video');
            setLoading(false);
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <AlertOctagon className="w-10 h-10 text-red-500 mb-2" />
          <p className="text-white">Video source unavailable</p>
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
};

export default VideoPlayer;