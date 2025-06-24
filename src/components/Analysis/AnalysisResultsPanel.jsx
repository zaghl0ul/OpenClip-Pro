import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  Eye,
  Terminal,
  Code,
  Clock,
  Zap,
  Activity,
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
  Maximize2,
} from 'lucide-react';

const AnalysisResultsPanel = ({ project, onSeekTo }) => {
  const [showRawData, setShowRawData] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLines, setConsoleLines] = useState([]);

  // Extract analysis data from the nested structure
  const analysisData = project?.video_data?.analysis?.results;
  const clips = analysisData?.clips || [];
  const hasAnalysis = project?.status === 'analyzed' && analysisData;

  useEffect(() => {
    if (hasAnalysis) {
      // Simulate console output for the analysis
      const lines = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Analysis completed successfully',
        },
        {
          timestamp: new Date().toISOString(),
          level: 'success',
          message: `Found ${clips.length} clips`,
        },
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Provider: ${analysisData.provider_used}`,
        },
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Frames analyzed: ${analysisData.frames_analyzed}`,
        },
        {
          timestamp: new Date().toISOString(),
          level: 'data',
          message: 'Raw response available in console',
        },
      ];
      setConsoleLines(lines);
    }
  }, [hasAnalysis, clips.length, analysisData]);

  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!hasAnalysis) {
    return (
      <div className="glass-prism rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">No analysis completed yet</p>
          <p className="text-white/40 text-sm mt-2">Run AI analysis to see detailed results here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <div className="glass-prism rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Analysis Results</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`glass-shine px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showConsole ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/60 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Console
            </button>
            <button
              onClick={() => setShowRawData(!showRawData)}
              className={`glass-shine px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showRawData ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              Raw Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-shine rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white/60 text-sm">Status</span>
            </div>
            <p className="text-white font-medium">Completed</p>
          </div>

          <div className="glass-shine rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-5 h-5 text-blue-400" />
              <span className="text-white/60 text-sm">Clips Found</span>
            </div>
            <p className="text-white font-medium">{clips.length}</p>
          </div>

          <div className="glass-shine rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-purple-400" />
              <span className="text-white/60 text-sm">Frames</span>
            </div>
            <p className="text-white font-medium">{analysisData.frames_analyzed || 0}</p>
          </div>

          <div className="glass-shine rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white/60 text-sm">Provider</span>
            </div>
            <p className="text-white font-medium capitalize">{analysisData.provider_used}</p>
          </div>
        </div>

        {/* Summary */}
        {analysisData.summary && (
          <div className="glass-shine rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-2">Summary</h3>
            <p className="text-white/80">{analysisData.summary}</p>
          </div>
        )}
      </div>

      {/* Console Panel */}
      <AnimatePresence>
        {showConsole && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-prism rounded-2xl overflow-hidden"
          >
            <div className="bg-black/50 p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-mono text-sm">Live Console Output</span>
              </div>
            </div>
            <div className="p-4 bg-black/30 font-mono text-sm max-h-64 overflow-y-auto">
              {consoleLines.map((line, index) => (
                <div key={index} className="flex gap-2 mb-1">
                  <span className="text-white/40 text-xs">
                    {new Date(line.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      line.level === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : line.level === 'error'
                          ? 'bg-red-500/20 text-red-400'
                          : line.level === 'data'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {line.level.toUpperCase()}
                  </span>
                  <span className="text-white/80">{line.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Raw Data Panel */}
      <AnimatePresence>
        {showRawData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-prism rounded-2xl overflow-hidden"
          >
            <div className="bg-purple-500/10 p-4 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-mono text-sm">Raw Analysis Data</span>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(analysisData, null, 2))}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-black/30">
              <pre className="text-xs text-white/80 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(analysisData, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clips Grid */}
      <div className="glass-prism rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Generated Clips</h3>

        {clips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.map((clip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-shine rounded-lg p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                onClick={() => {
                  if (
                    onSeekTo &&
                    typeof clip.start_time === 'number' &&
                    !isNaN(clip.start_time) &&
                    isFinite(clip.start_time) &&
                    clip.start_time >= 0
                  ) {
                    onSeekTo(clip.start_time);
                  } else {
                    console.warn('Invalid clip start time:', clip.start_time);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                    {clip.title || `Clip ${index + 1}`}
                  </h4>
                  <Play className="w-4 h-4 text-white/60 group-hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Time Range</span>
                    <span className="text-white font-mono">
                      {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Duration</span>
                    <span className="text-white">
                      {formatTime(clip.end_time - clip.start_time)}
                    </span>
                  </div>

                  {clip.score && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Score</span>
                        <span className="text-white">{Math.round(clip.score * 100)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${clip.score * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {clip.reason && (
                    <p className="text-white/60 text-xs mt-2 italic">{clip.reason}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-white/60">No clips were generated</p>
            <p className="text-white/40 text-sm mt-2">
              The AI analysis completed but didn't identify any suitable clips
            </p>
          </div>
        )}
      </div>

      {/* Raw Response Warning */}
      {analysisData.raw_response && analysisData.raw_response.includes('safety guidelines') && (
        <div className="glass-prism rounded-2xl p-6 bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-medium mb-1">Content Safety Notice</h3>
              <p className="text-yellow-400 text-sm mb-2">
                The AI model flagged content safety concerns with this video.
              </p>
              <details className="text-white/60 text-sm">
                <summary className="cursor-pointer hover:text-white">View raw response</summary>
                <div className="mt-2 p-2 bg-black/20 rounded text-xs">
                  {analysisData.raw_response}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResultsPanel;
