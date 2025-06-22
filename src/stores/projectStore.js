import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '../utils/apiClient'
import { useSettingsStore } from './settingsStore'

const useProjectStore = create(
  persist(
    (set, get) => ({
      // State
      projects: [],
      currentProject: null,
      isLoading: false,
      isProcessing: false,
      processingProgress: 0,
      processingStatus: '',
      error: null,
      
      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      // Project CRUD
      createProject: async (projectData) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await apiClient.createProject(projectData)
          const project = response.project || response // Handle both response formats
          
          set(state => ({
            projects: [...state.projects, project],
            currentProject: project,
            isLoading: false
          }))
          
          return project
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      updateProject: async (projectId, updates) => {
        try {
          set({ isLoading: true, error: null })
          
          const updatedProject = await apiClient.updateProject(projectId, updates)
          
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId ? updatedProject : p
            ),
            currentProject: state.currentProject?.id === projectId 
              ? updatedProject 
              : state.currentProject,
            isLoading: false
          }))
          
          return updatedProject
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      deleteProject: async (projectId) => {
        try {
          set({ isLoading: true, error: null })
          
          await apiClient.deleteProject(projectId)
          
          set(state => ({
            projects: state.projects.filter(p => p.id !== projectId),
            currentProject: state.currentProject?.id === projectId 
              ? null 
              : state.currentProject,
            isLoading: false
          }))
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      getProject: async (projectId) => {
        try {
          set({ isLoading: true, error: null })
          
          const project = await apiClient.getProject(projectId)
          
          set(state => ({
            currentProject: project,
            // Update in projects list if it exists
            projects: state.projects.map(p => 
              p.id === projectId ? project : p
            ),
            isLoading: false
          }))
          
          return project
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      loadProjects: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await apiClient.getProjects()
          const projects = response.projects || response // Handle both response formats
          
          set({
            projects,
            isLoading: false
          })
          
          return projects
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      // Video upload
      uploadVideo: async (projectId, file, onProgress) => {
        try {
          set({ isLoading: true, error: null })
          
          const result = await apiClient.uploadVideo(projectId, file, onProgress)
          
          // Update project with video data
          await get().updateProject(projectId, {
            status: 'uploaded',
            video_data: result.video_data,
            file_path: result.file_path
          })
          
          set({ isLoading: false })
          return result
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      // YouTube processing
      getYouTubeInfo: async (url) => {
        try {
          set({ isLoading: true, error: null })
          
          const result = await apiClient.getYouTubeInfo(url)
          
          set({ isLoading: false })
          return result
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      processYouTube: async (projectId, youtubeUrl, analyze = true, analysisTypes = []) => {
        try {
          set({ 
            isLoading: true, 
            isProcessing: true,
            processingStatus: 'Processing YouTube URL...',
            processingProgress: 0,
            error: null 
          })
          
          // Use the simpler processYouTube method which matches our backend
          const result = await apiClient.processYouTube(projectId, youtubeUrl)
          
          set({ 
            processingStatus: 'YouTube video processed successfully!',
            processingProgress: 100
          })
          
          // Clear progress after a delay
          setTimeout(() => {
            set({
              isProcessing: false,
              processingProgress: 0,
              processingStatus: '',
              isLoading: false
            })
          }, 2000)
          
          // Update project in local state
          if (result.project) {
            set(state => ({
              projects: state.projects.map(p => 
                p.id === projectId ? result.project : p
              ),
              currentProject: state.currentProject?.id === projectId 
                ? result.project 
                : state.currentProject,
            }))
          }
          
          return result
        } catch (error) {
          set({ 
            error: error.message, 
            isLoading: false,
            isProcessing: false,
            processingProgress: 0,
            processingStatus: ''
          })
          throw error
        }
      },
      
      // AI Analysis
      analyzeVideo: async (projectId, prompt, provider = null, model = null) => {
        try {
          set({ 
            isProcessing: true, 
            processingProgress: 0,
            processingStatus: 'Starting analysis...',
            error: null 
          })
          
          // Get settings if provider/model not specified
          if (!provider || !model) {
            const settings = useSettingsStore.getState()
            provider = provider || settings.modelSettings.defaultProvider
            model = model || settings.modelSettings.selectedModels[provider]
          }
          
          // Update project status
          await get().updateProject(projectId, {
            status: 'analyzing',
            analysis_prompt: prompt,
            analysis_provider: provider,
            analysis_model: model
          })
          
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            set(state => {
              const newProgress = Math.min(state.processingProgress + 5, 90)
              return {
                processingProgress: newProgress,
                processingStatus: newProgress < 30 ? 'Extracting video frames...' :
                                newProgress < 60 ? 'Analyzing content with AI...' :
                                newProgress < 90 ? 'Generating clips...' :
                                'Finalizing results...'
              }
            })
          }, 1000)
          
          try {
            // Start analysis
            const result = await apiClient.analyzeVideo(projectId, prompt, provider, model)
            
            clearInterval(progressInterval)
            
            set({
              processingProgress: 100,
              processingStatus: 'Analysis complete!',
            })
            
            // Update project with results
            await get().updateProject(projectId, {
              status: 'completed',
              clips: result.clips || []
            })
            
            setTimeout(() => {
              set({
                isProcessing: false,
                processingProgress: 0,
                processingStatus: '',
              })
            }, 1000)
            
            return result
          } catch (analysisError) {
            clearInterval(progressInterval)
            
            // Update project with error
            await get().updateProject(projectId, {
              status: 'error',
              error_message: analysisError.message
            })
            
            throw analysisError
          }
        } catch (error) {
          set({
            isProcessing: false,
            processingProgress: 0,
            processingStatus: '',
            error: error.message
          })
          throw error
        }
      },
      
      // Clip management
      updateClip: async (projectId, clipId, updates) => {
        try {
          const updatedClip = await apiClient.updateClip(clipId, updates)
          
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId 
                ? {
                    ...p,
                    clips: p.clips.map(c => 
                      c.id === clipId ? updatedClip : c
                    )
                  }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? {
                  ...state.currentProject,
                  clips: state.currentProject.clips.map(c =>
                    c.id === clipId ? updatedClip : c
                  )
                }
              : state.currentProject
          }))
          
          return updatedClip
        } catch (error) {
          set({ error: error.message })
          throw error
        }
      },
      
      deleteClip: async (projectId, clipId) => {
        try {
          await apiClient.deleteClip(clipId)
          
          set(state => ({
            projects: state.projects.map(p => 
              p.id === projectId 
                ? {
                    ...p,
                    clips: p.clips.filter(c => c.id !== clipId)
                  }
                : p
            ),
            currentProject: state.currentProject?.id === projectId
              ? {
                  ...state.currentProject,
                  clips: state.currentProject.clips.filter(c => c.id !== clipId)
                }
              : state.currentProject
          }))
        } catch (error) {
          set({ error: error.message })
          throw error
        }
      },
      
      // Export functionality
      exportClips: async (projectId, exportSettings) => {
        try {
          set({ isLoading: true, error: null })
          
          const result = await apiClient.exportClips(projectId, exportSettings)
          
          set({ isLoading: false })
          return result
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      exportClip: async (clipId, exportSettings) => {
        try {
          set({ isLoading: true, error: null })
          
          const result = await apiClient.exportClip(clipId, exportSettings)
          
          set({ isLoading: false })
          return result
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      // Search and filter
      searchProjects: async (query, filters = {}) => {
        try {
          set({ isLoading: true, error: null })
          
          const results = await apiClient.searchProjects(query, filters)
          
          set({
            projects: results,
            isLoading: false
          })
          
          return results
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },
      
      // Utility functions
      getProjectById: (projectId) => {
        const { projects } = get()
        return projects.find(p => p.id === projectId)
      },
      
      getProjectsByStatus: (status) => {
        const { projects } = get()
        return projects.filter(p => p.status === status)
      },
      
      getRecentProjects: (limit = 5) => {
        const { projects } = get()
        return projects
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, limit)
      },
      
      // Analytics
      getProjectStats: () => {
        const { projects } = get()
        
        return {
          total: projects.length,
          completed: projects.filter(p => p.status === 'completed').length,
          analyzing: projects.filter(p => p.status === 'analyzing').length,
          error: projects.filter(p => p.status === 'error').length,
          totalClips: projects.reduce((sum, p) => sum + (p.clips?.length || 0), 0),
          totalDuration: projects.reduce((sum, p) => 
            sum + (p.video_data?.duration || 0), 0
          )
        }
      },
      
      // Initialize
      initialize: async () => {
        try {
          await get().loadProjects()
          return true
        } catch (error) {
          console.warn('Failed to load projects:', error.message)
          return false
        }
      },
      
      // Reset store
      reset: () => {
        set({
          projects: [],
          currentProject: null,
          isLoading: false,
          isProcessing: false,
          processingProgress: 0,
          processingStatus: '',
          error: null
        })
      }
    }),
    {
      name: 'openclip-projects',
      // Only persist project references, not full data
      partialize: (state) => ({
        projects: state.projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          updated_at: p.updated_at
        }))
      })
    }
  )
)

export default useProjectStore