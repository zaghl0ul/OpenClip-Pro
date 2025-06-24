import { create } from 'zustand'
import apiClient from '../utils/apiClient'
import useProjectStore from './projectStore'

const useClipStore = create((set, get) => ({
  // State
  clips: [],
  currentClip: null,
  isLoading: false,
  error: null,
  
  // Basic actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  // Clip operations
  updateClip: async (projectId, clipId, updates) => {
    try {
      set({ isLoading: true, error: null })
      const updatedClip = await apiClient.updateClip(clipId, updates)
      
      // Update in project store as well
      const projectStore = useProjectStore.getState()
      projectStore.updateProject(projectId, {
        clips: projectStore.getProjectById(projectId)?.clips?.map(c =>
          c.id === clipId ? updatedClip : c
        ) || []
      })
      
      set(state => ({
        clips: state.clips.map(c => c.id === clipId ? updatedClip : c),
        currentClip: state.currentClip?.id === clipId ? updatedClip : state.currentClip,
        isLoading: false
      }))
      
      return updatedClip
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },
  
  deleteClip: async (projectId, clipId) => {
    try {
      set({ isLoading: true, error: null })
      await apiClient.deleteClip(clipId)
      
      // Update in project store as well
      const projectStore = useProjectStore.getState()
      projectStore.updateProject(projectId, {
        clips: projectStore.getProjectById(projectId)?.clips?.filter(c => c.id !== clipId) || []
      })
      
      set(state => ({
        clips: state.clips.filter(c => c.id !== clipId),
        currentClip: state.currentClip?.id === clipId ? null : state.currentClip,
        isLoading: false
      }))
    } catch (error) {
      set({ error: error.message, isLoading: false })
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
  
  // Utility functions
  getClipById: (clipId) => {
    const { clips } = get()
    return clips.find(c => c.id === clipId)
  },
  
  getClipsByProject: (projectId) => {
    const projectStore = useProjectStore.getState()
    const project = projectStore.getProjectById(projectId)
    return project?.clips || []
  },
  
  // Reset
  reset: () => {
    set({
      clips: [],
      currentClip: null,
      isLoading: false,
      error: null
    })
  }
}))

export default useClipStore 