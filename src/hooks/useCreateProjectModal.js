import { useState, useRef, useMemo } from 'react'
import { validateForm, isValidProjectName, isValidYouTubeUrl, isValidVideoFile, sanitizeText } from '../utils/validators'
import useProjectStore from '../stores/projectStore'
import toast from 'react-hot-toast'

export const useCreateProjectModal = () => {
  const [step, setStep] = useState(1)
  const [projectType, setProjectType] = useState('')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [dragActive, setDragActive] = useState(false)  
  const [errors, setErrors] = useState({})
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  
  const { createProject, uploadProgress: storeUploadProgress } = useProjectStore()

  // Validation rules
  const validationRules = {
    1: {
      projectType: [
        { required: true, message: 'Please select a project type' }
      ]
    },
    2: {
      projectName: [
        { required: true, message: 'Project name is required' },
        { validator: isValidProjectName, message: 'Project name must be 1-100 characters, letters, numbers, spaces, hyphens, and underscores only' }
      ]
    },
    3: projectType === 'youtube' ? {
      youtubeUrl: [
        { required: true, message: 'YouTube URL is required' },
        { validator: isValidYouTubeUrl, message: 'Please enter a valid YouTube URL' }
      ]
    } : {
      selectedFile: [
        { required: true, message: 'Please select a video file' },
        { validator: isValidVideoFile, message: 'Please select a valid video file (MP4, WebM, AVI, etc.) under 500MB' }
      ]
    }
  }

  // Validate current step
  const validateCurrentStep = () => {
    const stepRules = validationRules[step]
    if (!stepRules) return { isValid: true, errors: {} }

    const data = {
      projectType,
      projectName: sanitizeText(projectName),
      youtubeUrl,
      selectedFile
    }

    const validation = validateForm(data, stepRules)
    setErrors(validation.errors)
    
    return validation
  }

  // Check if can proceed to next step (memoized to avoid re-renders)
  const canProceedToNext = useMemo(() => {
    const stepRules = validationRules[step]
    if (!stepRules) return true

    const data = {
      projectType,
      projectName: sanitizeText(projectName),
      youtubeUrl,
      selectedFile
    }

    const validation = validateForm(data, stepRules)
    return validation.isValid
  }, [step, projectType, projectName, youtubeUrl, selectedFile])

  // Reset form
  const resetForm = () => {
    setStep(1)
    setProjectType('')
    setProjectName('')
    setDescription('')
    setYoutubeUrl('')
    setSelectedFile(null)
    setIsCreating(false)
    setDragActive(false)
    setErrors({})
    setUploadProgress(0)
    setIsUploading(false)
  }

  // File selection handlers
  const handleFileSelect = (file) => {
    try {
      if (!file) {
        setSelectedFile(null)
        setErrors(prev => ({ ...prev, selectedFile: null }))
        return
      }

      // Validate file
      if (!isValidVideoFile(file)) {
        const maxSize = 500 * 1024 * 1024;
        const isTooBig = file.size > maxSize;
        const errorMessage = isTooBig 
          ? `File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 500MB.`
          : `Unsupported file format (${file.type || 'unknown'}). Please use MP4, WebM, AVI, MOV, or other common video formats.`;
        
        setErrors({ selectedFile: errorMessage })
        toast.error(errorMessage)
        return
      }

      setSelectedFile(file)
      setErrors(prev => ({ ...prev, selectedFile: null }))
      console.log(`Selected file: ${file.name} (${file.type}, ${(file.size / (1024 * 1024)).toFixed(2)}MB)`)
      toast.success(`Selected: ${file.name}`)
    } catch (error) {
      console.error('File selection error:', error)
      toast.error('Error selecting file')
    }
  }

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    try {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0])
      }
    } catch (error) {
      console.error('Drop error:', error)
      toast.error('Error processing dropped file')
    }
  }

  // YouTube URL validation
  const validateYouTubeUrl = (url) => {
    if (!url) return false
    
    try {
      return isValidYouTubeUrl(url)
    } catch (error) {
      console.error('YouTube URL validation error:', error)
      return false
    }
  }

  // Project creation
  const handleCreateProject = async (onProjectCreated, onClose) => {
    if (isCreating) return

    try {
      // Final validation
      const validation = validateCurrentStep()
      if (!validation.isValid) {
        toast.error('Please fix the errors before creating the project')
        return
      }

      setIsCreating(true)

      // Sanitize inputs
      const sanitizedName = sanitizeText(projectName)
      const sanitizedDescription = sanitizeText(description)

      // Prepare project data
      const projectData = {
        name: sanitizedName,
        description: sanitizedDescription,
        type: projectType
      }

      // Add type-specific data
      if (projectType === 'youtube') {
        if (!validateYouTubeUrl(youtubeUrl)) {
          throw new Error('Invalid YouTube URL')
        }
        projectData.youtube_url = youtubeUrl
      } else if (projectType === 'upload') {
        if (!selectedFile || !isValidVideoFile(selectedFile)) {
          throw new Error('Invalid video file')
        }
        
        // Set uploading state
        setIsUploading(true)
        setUploadProgress(0)
        
        // Ensure we're passing the file object correctly
        projectData.file = selectedFile
        
        console.log('File being sent to API:', {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size
        })
      } else {
        throw new Error('Invalid project type')
      }

      // Create project
      const project = await createProject(projectData)
      
      if (project && project.id) {
        toast.success('Project created successfully!')
        resetForm()
        
        if (onProjectCreated) {
          onProjectCreated(project)
        }
        
        // Clear upload state
        setIsUploading(false)
        setUploadProgress(0)
        
        // Don't close immediately - let the parent handle navigation
        // if (onClose) {
        //   onClose()
        // }
        
        return project
      } else {
        throw new Error('Failed to create project')
      }
    } catch (error) {
      console.error('Project creation error:', error)
      
      let errorMessage = 'Failed to create project'
      
      if (error.message.includes('authentication')) {
        errorMessage = 'Authentication required. Please log in.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (error.message.includes('file')) {
        errorMessage = 'File upload failed. Please try again.'
      } else if (error.message.includes('YouTube')) {
        errorMessage = 'Invalid YouTube URL or video not accessible.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      setErrors({ general: errorMessage })
    } finally {
      setIsCreating(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
    
    return null
  }

  // Step navigation
  const nextStep = () => {
    if (canProceedToNext && step < 3) {
      setStep(step + 1)
      setErrors({}) // Clear errors when moving to next step
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
      setErrors({}) // Clear errors when moving to previous step
    }
  }

  // Input handlers with validation
  const setProjectNameWithValidation = (name) => {
    const sanitized = sanitizeText(name)
    setProjectName(sanitized)
    
    // Clear error if input becomes valid
    if (isValidProjectName(sanitized)) {
      setErrors(prev => ({ ...prev, projectName: null }))
    }
  }

  const setYoutubeUrlWithValidation = (url) => {
    setYoutubeUrl(url)
    
    // Clear error if URL becomes valid
    if (validateYouTubeUrl(url)) {
      setErrors(prev => ({ ...prev, youtubeUrl: null }))
    }
  }

  const setDescriptionWithValidation = (desc) => {
    const sanitized = sanitizeText(desc)
    setDescription(sanitized)
  }

      return {
    // State
    step,
    projectType,
    projectName,
    description,
    youtubeUrl,
    selectedFile,
    isCreating,
    dragActive,
    errors,
    fileInputRef,
    uploadProgress: storeUploadProgress || uploadProgress,
    isUploading,

    // Actions
    setStep,
    setProjectType,
    setProjectName: setProjectNameWithValidation,
    setDescription: setDescriptionWithValidation,
    setYoutubeUrl: setYoutubeUrlWithValidation,
    resetForm,
    handleFileSelect,
    handleDrag,
    handleDrop,
    validateYouTubeUrl,
    handleCreateProject,
    canProceedToNext,
    validateCurrentStep,
    nextStep,
    prevStep
  }
}