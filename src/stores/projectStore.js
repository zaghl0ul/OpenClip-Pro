import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

const useProjectStore = create(
  persist(
    (set, get) => ({
      // Current state
      projects: [],
      currentProject: null,
      isProcessing: false,
      processingProgress: 0,
      processingStatus: '',
      
      // Initialize store
      initialize: async () => {
        set({ isProcessing: false });
        return true;
      },
      
      // Actions - Real implementations
      createProject: async (projectData) => {
        set({ isProcessing: true });
        
        try {
          const project = {
            id: uuidv4(),
            name: typeof projectData === 'string' ? projectData : projectData.name,
            description: typeof projectData === 'string' ? '' : (projectData.description || ''),
            type: projectData.type || 'upload',
            status: 'created',
            clips: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          set((state) => ({
            projects: [project, ...state.projects],
            currentProject: project,
            isProcessing: false
          }));
          
          return project;
        } catch (error) {
          set({ isProcessing: false });
          throw error;
        }
      },
      
      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? { ...project, ...updates, updated_at: new Date().toISOString() }
              : project
          ),
          currentProject: state.currentProject?.id === projectId
            ? { ...state.currentProject, ...updates, updated_at: new Date().toISOString() }
            : state.currentProject,
        }))
      },
      
      deleteProject: async (projectId) => {
        set((state) => ({
          projects: state.projects.filter(project => project.id !== projectId),
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        }));
      },
      
      setCurrentProject: (projectId) => {
        const state = get()
        const project = state.projects.find(p => p.id === projectId)
        if (project) {
          set({ currentProject: project })
        }
      },
      
      addVideoToProject: async (projectId, videoData) => {
        set({ isProcessing: true });
        
        try {
          // Real video data from file/upload
          const video = {
            id: uuidv4(),
            name: videoData.name || 'Uploaded Video',
            path: videoData.path || null,
            url: videoData.url || null,
            duration: videoData.duration || 0, // Real duration from video metadata
            size: videoData.size || 0,
            format: videoData.format || videoData.name.split('.').pop().toLowerCase() || 'mp4',
            width: videoData.width || null,
            height: videoData.height || null,
            frameRate: videoData.frameRate || null,
            bitrate: videoData.bitrate || null,
            codec: videoData.codec || null,
            uploaded_at: new Date().toISOString()
          };
          
          get().updateProject(projectId, { 
            video,
            status: 'uploaded'
          });
          
          set({ isProcessing: false });
          return video;
        } catch (error) {
          set({ isProcessing: false });
          throw error;
        }
      },
      
      setAnalysisPrompt: (projectId, prompt) => {
        get().updateProject(projectId, {
          analysisPrompt: prompt,
        })
      },
      
      startAnalysis: async (projectId, provider = null, model = null) => {
        const state = get()
        const project = state.projects.find(p => p.id === projectId)
        
        if (!project || !project.video || !project.analysisPrompt) {
          throw new Error('Project, video, and analysis prompt are required')
        }
        
        set({
          isProcessing: true,
          processingProgress: 0,
          processingStatus: 'Initializing analysis...',
        })
        
        get().updateProject(projectId, { status: 'analyzing' })
        
        try {
          // Real analysis implementation would:
          // 1. Send video and prompt to AI service
          // 2. Receive analysis results with detected segments
          // 3. Process and store the results
          
          // For now, return empty clips array until backend is connected
          const analysisResults = {
            clips: [],
            provider: provider || 'none',
            model: model || 'none',
            analysisCompleted: false,
            error: 'Analysis service not connected. Please configure AI provider in settings.'
          };
          
          get().updateProject(projectId, {
            clips: analysisResults.clips,
            status: 'error',
            analysis_provider: analysisResults.provider,
            analysis_model: analysisResults.model,
            error: analysisResults.error
          });
          
          set({
            isProcessing: false,
            processingProgress: 0,
            processingStatus: '',
          });
          
          return analysisResults;
        } catch (error) {
          get().updateProject(projectId, {
            status: 'error',
            error: error.message,
          })
          throw error
        } finally {
          set({
            isProcessing: false,
            processingProgress: 0,
            processingStatus: '',
          })
        }
      },
      
      updateClip: (projectId, clipId, updates) => {
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? {
                  ...project,
                  clips: project.clips.map(clip =>
                    clip.id === clipId ? { ...clip, ...updates } : clip
                  ),
                  updated_at: new Date().toISOString(),
                }
              : project
          ),
          currentProject: state.currentProject?.id === projectId
            ? {
                ...state.currentProject,
                clips: state.currentProject.clips.map(clip =>
                  clip.id === clipId ? { ...clip, ...updates } : clip
                ),
                updated_at: new Date().toISOString(),
              }
            : state.currentProject,
        }))
      },
      
      deleteClip: (projectId, clipId) => {
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? {
                  ...project,
                  clips: project.clips.filter(clip => clip.id !== clipId),
                  updated_at: new Date().toISOString(),
                }
              : project
          ),
          currentProject: state.currentProject?.id === projectId
            ? {
                ...state.currentProject,
                clips: state.currentProject.clips.filter(clip => clip.id !== clipId),
                updated_at: new Date().toISOString(),
              }
            : state.currentProject,
        }))
      },
      
      reorderClips: (projectId, clipIds) => {
        const state = get()
        const project = state.projects.find(p => p.id === projectId)
        if (!project) return
        
        const reorderedClips = clipIds.map(id => 
          project.clips.find(clip => clip.id === id)
        ).filter(Boolean)
        
        get().updateProject(projectId, { clips: reorderedClips })
      },
      
      exportClip: async (projectId, clipId, format = 'mp4', options = {}) => {
        const state = get()
        const project = state.projects.find(p => p.id === projectId)
        const clip = project?.clips.find(c => c.id === clipId)
        
        if (!project || !clip) {
          throw new Error('Project or clip not found')
        }
        
        set({
          isProcessing: true,
          processingStatus: `Preparing export for ${clip.name}...`,
        })
        
        try {
          // Real export would:
          // 1. Extract video segment based on clip timestamps
          // 2. Apply any transformations/effects
          // 3. Encode to requested format
          // 4. Return download URL or blob
          
          const exportData = {
            clipId,
            projectId,
            format,
            exportedAt: Date.now(),
            filename: `${clip.name}.${format}`,
            status: 'pending',
            error: 'Export service not available. Please ensure FFmpeg is properly configured.',
            ...options
          }
          
          // For now, return error status
          return exportData
          
        } finally {
          set({
            isProcessing: false,
            processingStatus: '',
          })
        }
      },
      
      // Utility functions
      getProjectById: (projectId) => {
        const state = get()
        return state.projects.find(p => p.id === projectId)
      },
      
      getRecentProjects: (limit = 5) => {
        const state = get()
        const projects = state.projects || []
        return projects
          .sort((a, b) => {
            const aDate = new Date(a.updated_at || a.created_at || 0)
            const bDate = new Date(b.updated_at || b.created_at || 0)
            return bDate - aDate
          })
          .slice(0, limit)
      },

      searchProjects: (query) => {
        const state = get()
        const projects = state.projects || []
        const lowercaseQuery = query.toLowerCase()
        return projects.filter(project =>
          (project.name || '').toLowerCase().includes(lowercaseQuery) ||
          (project.description || '').toLowerCase().includes(lowercaseQuery)
        )
      },
      
      getProjectStats: () => {
        const state = get()
        const projects = Array.isArray(state.projects) ? state.projects : []
        return {
          totalProjects: projects.length,
          completedProjects: projects.filter(p => p.status === 'completed').length,
          totalClips: projects.reduce((sum, p) => sum + (Array.isArray(p.clips) ? p.clips.length : 0), 0),
          averageScore: projects.length > 0 ? projects.reduce((sum, p) => {
            const projectAvg = Array.isArray(p.clips) && p.clips.length > 0 
              ? p.clips.reduce((s, c) => s + (c?.score || 0), 0) / p.clips.length 
              : 0
            return sum + projectAvg
          }, 0) / projects.length : 0,
        }
      },
      
      getProject: async (projectId) => {
        const { projects } = get();
        return projects.find(p => p.id === projectId);
      },
      
      // Backend integration methods
      connectToBackend: async (backendUrl) => {
        try {
          const response = await fetch(`${backendUrl}/api/health`);
          if (response.ok) {
            set({ isBackendConnected: true });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Backend connection failed:', error);
          return false;
        }
      },
      
      syncWithBackend: async () => {
        // Implement backend sync when available
        const state = get();
        if (state.isBackendConnected) {
          // Sync projects with backend
          try {
            // await syncProjects(state.projects);
          } catch (error) {
            console.error('Sync failed:', error);
          }
        }
      }
    }),
    {
      name: 'openclip-projects',
      partialize: (state) => ({
        projects: state.projects,
      }),
    }
  )
)

export default useProjectStore