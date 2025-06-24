import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../utils/apiClient';
import { useSettingsStore } from './settingsStore';

// Utility functions for project operations
const projectUtils = {
  // Analytics utilities
  calculateStats: (projects) => ({
    total: projects.length,
    completed: projects.filter((p) => p.status === 'completed').length,
    analyzing: projects.filter((p) => p.status === 'analyzing').length,
    error: projects.filter((p) => p.status === 'error').length,
    totalClips: projects.reduce((sum, p) => sum + (p.clips?.length || 0), 0),
    totalDuration: projects.reduce((sum, p) => sum + (p.video_data?.duration || 0), 0),
  }),

  // Project filtering
  filterByStatus: (projects, status) => projects.filter((p) => p.status === status),

  getRecentProjects: (projects, limit = 5) =>
    projects.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, limit),

  // State update helpers
  updateProjectInList: (projects, projectId, updates) =>
    projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),

  removeProjectFromList: (projects, projectId) => projects.filter((p) => p.id !== projectId),

  // Progress simulation with cleanup
  createProgressInterval: (updateFn, cleanup) => {
    const interval = setInterval(() => {
      updateFn((prevState) => {
        const newProgress = Math.min(prevState.processingProgress + 5, 90);
        return {
          processingProgress: newProgress,
          processingStatus:
            newProgress < 30
              ? 'Extracting video frames...'
              : newProgress < 60
                ? 'Analyzing content with AI...'
                : newProgress < 90
                  ? 'Generating clips...'
                  : 'Finalizing results...',
        };
      });
    }, 1000);

    // Auto-cleanup after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      if (cleanup) cleanup();
    }, 30000);

    return interval;
  },
};

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
      uploadProgress: 0,
      error: null,

      // Basic actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Project CRUD - Optimized with better error handling
      createProject: async (projectData) => {
        try {
          set({ isLoading: true, error: null });
          let project;

          if (projectData.file) {
            // Handle file upload projects
            const projectInfo = { ...projectData };
            delete projectInfo.file;

            const response = await apiClient.createProject(projectInfo);
            project = response.project || response;

            const uploadResult = await apiClient.uploadVideo(
              project.id,
              projectData.file,
              (progress) => {
                set({ uploadProgress: progress });
              }
            );

            const updatedProject = await apiClient.getProject(project.id);
            project = updatedProject.project || updatedProject;
          } else if (projectData.youtube_url) {
            // Handle YouTube URL projects - create and process immediately
            const response = await apiClient.createProject(projectData);
            project = response.project || response;

            // Process YouTube URL immediately for consistency
            try {
              const result = await get().processYouTubeForProject(project.id, projectData.youtube_url);
              project = result.project || project;
            } catch (youtubeError) {
              console.warn('YouTube processing failed during creation:', youtubeError);
              // Don't fail the entire creation if YouTube processing fails
              // The user can retry from the project detail page
            }
          } else {
            // Handle basic project creation (no content)
            const response = await apiClient.createProject(projectData);
            project = response.project || response;
          }

          set((state) => ({
            projects: [...state.projects, project],
            currentProject: project,
            isLoading: false,
            uploadProgress: 0,
          }));

          return project;
        } catch (error) {
          console.error('Project creation error:', error);
          set({ error: error.message, isLoading: false, uploadProgress: 0 });
          throw error;
        }
      },

      updateProject: async (projectId, updates) => {
        try {
          set({ isLoading: true, error: null });
          const updatedProject = await apiClient.updateProject(projectId, updates);

          set((state) => ({
            projects: projectUtils.updateProjectInList(state.projects, projectId, updatedProject),
            currentProject:
              state.currentProject?.id === projectId ? updatedProject : state.currentProject,
            isLoading: false,
          }));

          return updatedProject;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteProject: async (projectId) => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.deleteProject(projectId);

          set((state) => ({
            projects: projectUtils.removeProjectFromList(state.projects, projectId),
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Optimized project loading with error recovery
      loadProjects: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.getProjects();
          const projects = response.projects || response;

          set({ projects, isLoading: false });
          return projects;
        } catch (error) {
          console.error('Failed to load projects:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Standardized YouTube processing method
      processYouTubeForProject: async (projectId, youtubeUrl) => {
        let progressInterval = null;

        try {
          set({
            isLoading: true,
            isProcessing: true,
            processingStatus: 'Processing YouTube URL...',
            processingProgress: 0,
            error: null,
          });

          // Start progress simulation
          progressInterval = setInterval(() => {
            set((prevState) => {
              const newProgress = Math.min(prevState.processingProgress + 8, 85);
              return {
                processingProgress: newProgress,
                processingStatus:
                  newProgress < 30
                    ? 'Validating YouTube URL...'
                    : newProgress < 60
                      ? 'Downloading video metadata...'
                      : 'Processing video content...',
              };
            });
          }, 1500);

          const result = await apiClient.processYouTube(projectId, youtubeUrl);

          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }

          set({
            processingStatus: 'YouTube video processed successfully!',
            processingProgress: 100,
          });

          // Auto-clear progress after showing success
          setTimeout(() => {
            set({
              isProcessing: false,
              processingProgress: 0,
              processingStatus: '',
              isLoading: false,
            });
          }, 2000);

          // Update project in state
          if (result.project) {
            set((state) => ({
              projects: projectUtils.updateProjectInList(state.projects, projectId, result.project),
              currentProject:
                state.currentProject?.id === projectId ? result.project : state.currentProject,
            }));
          }

          return result;
        } catch (error) {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          
          set({
            error: error.message,
            isLoading: false,
            isProcessing: false,
            processingProgress: 0,
            processingStatus: '',
          });
          throw error;
        }
      },

      // Standardized file upload method
      uploadVideoToProject: async (projectId, file, onProgress) => {
        try {
          set({ isLoading: true, error: null, uploadProgress: 0 });

          const result = await apiClient.uploadVideo(projectId, file, (progress) => {
            set({ uploadProgress: progress });
            if (onProgress) onProgress(progress);
          });

          // Get updated project data
          const updatedProject = await apiClient.getProject(projectId);
          const project = updatedProject.project || updatedProject;

          set((state) => ({
            projects: projectUtils.updateProjectInList(state.projects, projectId, project),
            currentProject: state.currentProject?.id === projectId ? project : state.currentProject,
            isLoading: false,
            uploadProgress: 0,
          }));

          return { project, upload: result };
        } catch (error) {
          set({ error: error.message, isLoading: false, uploadProgress: 0 });
          throw error;
        }
      },

      // Optimized YouTube processing with better progress tracking (legacy method)
      processYouTube: async (projectId, youtubeUrl) => {
        return get().processYouTubeForProject(projectId, youtubeUrl);
      },

      // Optimized AI analysis with better cleanup
      analyzeVideo: async (projectId, prompt, provider = null, model = null) => {
        let progressInterval = null;

        try {
          set({
            isProcessing: true,
            processingProgress: 0,
            processingStatus: 'Starting analysis...',
            error: null,
          });

          if (!provider || !model) {
            const settings = useSettingsStore.getState();
            provider = provider || settings.modelSettings.defaultProvider;
            model = model || settings.modelSettings.selectedModels[provider];
          }

          await get().updateProject(projectId, {
            status: 'analyzing',
            analysis_prompt: prompt,
            analysis_provider: provider,
            analysis_model: model,
          });

          // Improved progress simulation with cleanup
          progressInterval = projectUtils.createProgressInterval(
            set,
            () => (progressInterval = null)
          );

          try {
            const result = await apiClient.analyzeVideo(projectId, prompt, provider, model);

            if (progressInterval) {
              clearInterval(progressInterval);
              progressInterval = null;
            }

            set({
              processingProgress: 100,
              processingStatus: 'Analysis complete!',
            });

            await get().updateProject(projectId, {
              status: 'completed',
              clips: result.clips || [],
            });

            setTimeout(() => {
              set({
                isProcessing: false,
                processingProgress: 0,
                processingStatus: '',
              });
            }, 1000);

            return result;
          } catch (analysisError) {
            if (progressInterval) {
              clearInterval(progressInterval);
              progressInterval = null;
            }

            await get().updateProject(projectId, {
              status: 'error',
              error_message: analysisError.message,
            });

            throw analysisError;
          }
        } catch (error) {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }

          set({
            isProcessing: false,
            processingProgress: 0,
            processingStatus: '',
            error: error.message,
          });
          throw error;
        }
      },

      // Utility functions using the extracted utilities
      getProjectById: (projectId) => {
        const { projects } = get();
        return projects.find((p) => p.id === projectId);
      },

      getProjectsByStatus: (status) => {
        const { projects } = get();
        return projectUtils.filterByStatus(projects, status);
      },

      getRecentProjects: (limit = 5) => {
        const { projects } = get();
        return projectUtils.getRecentProjects(projects, limit);
      },

      getProjectStats: () => {
        const { projects } = get();
        return projectUtils.calculateStats(projects);
      },

      // Simplified initialization
      initialize: async () => {
        try {
          await get().loadProjects();
          return true;
        } catch (error) {
          console.warn('Failed to load projects:', error.message);
          return false;
        }
      },

      // Complete reset
      reset: () => {
        set({
          projects: [],
          currentProject: null,
          isLoading: false,
          isProcessing: false,
          processingProgress: 0,
          processingStatus: '',
          uploadProgress: 0,
          error: null,
        });
      },
    }),
    {
      name: 'openclip-projects',
      partialize: (state) => ({
        projects: state.projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          updated_at: p.updated_at,
        })),
      }),
    }
  )
);

export default useProjectStore;
