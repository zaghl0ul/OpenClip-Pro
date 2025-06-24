/**
 * Content Processing Service
 * Standardizes upload/YouTube processing flows across the application
 */

import useProjectStore from '../stores/projectStore';
import toast from 'react-hot-toast';

export class ContentProcessingService {
  /**
   * Process content (file upload or YouTube URL) for a project
   * @param {string} projectId - The project ID
   * @param {Object} content - Content to process ({ file: File } or { youtubeUrl: string })
   * @param {Object} callbacks - Optional callbacks for progress and state updates
   */
  static async processContent(projectId, content, callbacks = {}) {
    const {
      onProgress = () => {},
      onStateChange = () => {},
      onSuccess = () => {},
      onError = () => {},
    } = callbacks;

    try {
      onStateChange({ isProcessing: true, progress: 0, status: 'Starting...' });

      if (content.file && content.file instanceof File) {
        return await this.processFileUpload(projectId, content.file, {
          onProgress,
          onStateChange,
          onSuccess,
          onError,
        });
      } else if (content.youtubeUrl && typeof content.youtubeUrl === 'string') {
        return await this.processYouTubeUrl(projectId, content.youtubeUrl, {
          onProgress,
          onStateChange,
          onSuccess,
          onError,
        });
      } else {
        throw new Error('Invalid content type. Must provide either file or youtubeUrl.');
      }
    } catch (error) {
      onError(error);
      throw error;
    }
  }

  /**
   * Process file upload for a project
   */
  static async processFileUpload(projectId, file, callbacks = {}) {
    const { onProgress, onStateChange, onSuccess, onError } = callbacks;

    try {
      onStateChange({ isProcessing: true, progress: 0, status: 'Uploading video...' });

      const { uploadVideoToProject } = useProjectStore.getState();
      const result = await uploadVideoToProject(projectId, file, (progress) => {
        onProgress(progress);
        onStateChange({
          isProcessing: true,
          progress,
          status: progress < 100 ? 'Uploading video...' : 'Processing video...',
        });
      });

      onStateChange({ isProcessing: false, progress: 100, status: 'Upload complete!' });
      onSuccess(result);
      return result;
    } catch (error) {
      onStateChange({ isProcessing: false, progress: 0, status: 'Upload failed' });
      onError(error);
      throw error;
    }
  }

  /**
   * Process YouTube URL for a project
   */
  static async processYouTubeUrl(projectId, youtubeUrl, callbacks = {}) {
    const { onProgress, onStateChange, onSuccess, onError } = callbacks;

    try {
      onStateChange({ isProcessing: true, progress: 0, status: 'Processing YouTube URL...' });

      const { processYouTubeForProject } = useProjectStore.getState();
      const result = await processYouTubeForProject(projectId, youtubeUrl);

      onStateChange({ isProcessing: false, progress: 100, status: 'YouTube video processed!' });
      onSuccess(result);
      return result;
    } catch (error) {
      onStateChange({ isProcessing: false, progress: 0, status: 'Processing failed' });
      onError(error);
      throw error;
    }
  }

  /**
   * Create a project with content in one step
   * @param {Object} projectData - Project creation data
   * @param {Object} content - Content to add ({ file: File } or { youtubeUrl: string })
   * @param {Object} callbacks - Progress and state callbacks
   */
  static async createProjectWithContent(projectData, content, callbacks = {}) {
    const {
      onProgress = () => {},
      onStateChange = () => {},
      onSuccess = () => {},
      onError = () => {},
    } = callbacks;

    try {
      onStateChange({ isProcessing: true, progress: 0, status: 'Creating project...' });

      // Prepare project data based on content type
      const projectInfo = { ...projectData };
      
      if (content.file && content.file instanceof File) {
        projectInfo.type = 'upload';
        projectInfo.file = content.file;
      } else if (content.youtubeUrl && typeof content.youtubeUrl === 'string') {
        projectInfo.type = 'youtube';
        projectInfo.youtube_url = content.youtubeUrl;
      } else {
        projectInfo.type = 'basic';
      }

      // Create the project (this will handle content processing automatically)
      const { createProject } = useProjectStore.getState();
      const project = await createProject(projectInfo);

      onStateChange({ isProcessing: false, progress: 100, status: 'Project created successfully!' });
      onSuccess(project);
      return project;
    } catch (error) {
      onStateChange({ isProcessing: false, progress: 0, status: 'Project creation failed' });
      onError(error);
      throw error;
    }
  }

  /**
   * Validate content before processing
   */
  static validateContent(content) {
    if (content.file) {
      return this.validateFile(content.file);
    } else if (content.youtubeUrl) {
      return this.validateYouTubeUrl(content.youtubeUrl);
    }
    return { isValid: false, error: 'No content provided' };
  }

  /**
   * Validate file upload
   */
  static validateFile(file) {
    if (!file || !(file instanceof File)) {
      return { isValid: false, error: 'Invalid file' };
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 500MB.`,
      };
    }

    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/avi',
      'video/mov',
      'video/quicktime',
      'video/x-msvideo',
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Unsupported file format (${file.type}). Please use MP4, WebM, AVI, or MOV.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate YouTube URL
   */
  static validateYouTubeUrl(url) {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'Invalid YouTube URL' };
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      return { isValid: false, error: 'Please enter a valid YouTube URL' };
    }

    return { isValid: true };
  }

  /**
   * Get standardized error message
   */
  static getErrorMessage(error) {
    if (error.message.includes('authentication')) {
      return 'Authentication required. Please log in.';
    } else if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    } else if (error.message.includes('file')) {
      return 'File upload failed. Please try again.';
    } else if (error.message.includes('YouTube')) {
      return 'Invalid YouTube URL or video not accessible.';
    } else if (error.message.includes('size')) {
      return 'File too large. Maximum size is 500MB.';
    } else if (error.message.includes('format')) {
      return 'Unsupported file format. Please use MP4, WebM, AVI, or MOV.';
    }
    return error.message || 'An unexpected error occurred';
  }

  /**
   * Show standardized success message
   */
  static showSuccessMessage(type, projectName = '') {
    const messages = {
      upload: `Video uploaded successfully${projectName ? ` for ${projectName}` : ''}!`,
      youtube: `YouTube video processed successfully${projectName ? ` for ${projectName}` : ''}!`,
      project: `Project created successfully${projectName ? `: ${projectName}` : ''}!`,
    };
    
    toast.success(messages[type] || 'Operation completed successfully!');
  }

  /**
   * Show standardized error message
   */
  static showErrorMessage(error, operation = 'operation') {
    const message = this.getErrorMessage(error);
    toast.error(`${operation} failed: ${message}`);
  }
}

export default ContentProcessingService; 