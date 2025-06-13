import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { 
  Video, Play, Pause, Upload, Download, Trash2,
  ChevronLeft, Clock, Film, Settings
} from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, getProjectById, updateProject, deleteProject } = useProjectStore();
  const [project, setProject] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    const loadProject = async () => {
      // Try to find the project by ID
      const projectData = projects.find(p => p.id === id) || await getProjectById(id);
      if (projectData) {
        setProject(projectData);
        console.log("Loaded project:", projectData);
      } else {
        navigate('/projects');
      }
    };
    loadProject();
  }, [id, projects, getProjectById, navigate]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && project) {
      // Create a URL for the video file
      const videoUrl = URL.createObjectURL(file);
      console.log("Created video URL:", videoUrl);
      
      const updatedProject = {
        ...project,
        video: {
          name: file.name,
          url: videoUrl,
          size: file.size,
          type: file.type
        }
      };
      
      updateProject(project.id, {
        video: {
          name: file.name,
          url: videoUrl,
          size: file.size,
          type: file.type
        }
      });
      
      setProject(updatedProject);
      console.log("Updated project with video:", updatedProject);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(project.id);
      navigate('/projects');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white/60">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-minimal rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="glass-minimal rounded-lg p-2 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-white/60 mt-1">{project.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {project.video && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = project.video.url;
                  a.download = project.video.name;
                  a.click();
                }}
                className="glass-minimal px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-white"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            <button
              onClick={handleDelete}
              className="glass-minimal px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
        
        {/* Project Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-minimal rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Created</span>
            </div>
            <p className="text-white">{new Date(project.created_at).toLocaleDateString()}</p>
          </div>
          
          <div className="glass-minimal rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Film className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Clips</span>
            </div>
            <p className="text-white">{project.clips?.length || 0}</p>
          </div>
          
          <div className="glass-minimal rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Video className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Video</span>
            </div>
            <p className="text-white">{project.video ? 'Uploaded' : 'No video'}</p>
          </div>
          
          <div className="glass-minimal rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">Status</span>
            </div>
            <p className="text-white capitalize">{project.status || 'created'}</p>
          </div>
        </div>
      </div>

      {/* Video Player Section */}
      <div className="glass-minimal rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Video Player</h2>
        
        {!project.video ? (
          <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center">
            <Video className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60 mb-4">No video uploaded yet</p>
            <label className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-6 py-3 rounded-lg text-white cursor-pointer inline-flex items-center gap-2 transition-colors">
              <Upload className="w-5 h-5" />
              Upload Video
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <ReactPlayer
                url={project.video.url}
                playing={playing}
                controls={false}
                width="100%"
                height="100%"
                onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                onDuration={setDuration}
              />
              
              {/* Custom Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPlaying(!playing)}
                    className="glass-minimal rounded-full p-3 hover:bg-white/20 transition-colors text-white"
                  >
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <span>{formatTime(currentTime)}</span>
                      <div className="flex-1 h-1 bg-white/20 rounded-full">
                        <div 
                          className="h-full bg-white rounded-full"
                          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-minimal rounded-lg p-3">
                <p className="text-sm text-white/60 mb-1">File Name</p>
                <p className="text-white text-sm truncate">{project.video.name}</p>
              </div>
              <div className="glass-minimal rounded-lg p-3">
                <p className="text-sm text-white/60 mb-1">Duration</p>
                <p className="text-white text-sm">{formatTime(duration)}</p>
              </div>
              <div className="glass-minimal rounded-lg p-3">
                <p className="text-sm text-white/60 mb-1">Format</p>
                <p className="text-white text-sm">{project.video.type || 'video/mp4'}</p>
              </div>
              <div className="glass-minimal rounded-lg p-3">
                <p className="text-sm text-white/60 mb-1">Size</p>
                <p className="text-white text-sm">
                  {project.video.size ? `${(project.video.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clips Section */}
      <div className="glass-minimal rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Clips</h2>
        
        {project.clips && project.clips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.clips.map((clip) => (
              <div key={clip.id} className="glass-minimal rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">{clip.name}</h3>
                <p className="text-white/60 text-sm mb-3">{clip.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">
                    {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                  </span>
                  <span className="text-white/60">
                    {clip.duration}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Film className="w-12 h-12 text-white/40 mx-auto mb-3" />
            <p className="text-white/60">No clips generated yet</p>
            {project.video && (
              <p className="text-white/40 text-sm mt-2">
                Configure AI providers in settings to analyze your video
              </p>
            )}
          </div>
        )}
      </div>

      {/* Analysis Section */}
      {project.analysisPrompt && (
        <div className="glass-minimal rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Analysis Configuration</h2>
          <div className="glass-minimal rounded-lg p-4">
            <p className="text-sm text-white/60 mb-2">Analysis Prompt:</p>
            <p className="text-white">{project.analysisPrompt}</p>
          </div>
          {project.error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{project.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;