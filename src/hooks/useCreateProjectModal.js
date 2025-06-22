import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import useProjectStore from '../stores/projectStore'

export const useCreateProjectModal = () => {
  const [step, setStep] = useState(1)
  const [projectType, setProjectType] = useState('upload')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const { createProject, uploadVideo, processYouTube } = useProjectStore()

  const resetForm = () => {
    setStep(1)
    setProjectType('upload')
    setProjectName('')
    setDescription('')
    setSelectedFile(null)
    setYoutubeUrl('')
    setIsCreating(false)
    setUploadProgress(0)
    setDragActive(false)
  }

  const canProceedToNext = () => {
    switch (step) {
      case 1: // Project type
        return projectType !== ''
      case 2: // Project details
        return projectName.trim() !== ''
      case 3: // File/URL input
        if (projectType === 'upload') {
          return selectedFile !== null
        } else if (projectType === 'youtube') {
          return youtubeUrl.trim() !== '' && validateYouTubeUrl(youtubeUrl)
        }
        return true
      default:
        return true
    }
  }

  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    return youtubeRegex.test(url)
  }

  const handleCreateProject = async (onProjectCreated, onClose) => {
    if (!canProceedToNext()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)

    try {
      // Create the project first
      const projectData = {
        name: projectName.trim(),
        description: description.trim(),
        type: projectType
      }

      console.log('Creating project:', projectData)
      const project = await createProject(projectData)
      console.log('Project created:', project)

      if (project) {
        // Handle file upload or YouTube processing
        if (projectType === 'upload' && selectedFile) {
          try {
            console.log('Uploading video file...')
            const loadingToast = toast.loading('Uploading video...')
            
            await uploadVideo(project.id, selectedFile, (progress) => {
              setUploadProgress(progress)
            })
            
            toast.dismiss(loadingToast)
            toast.success('Project created and video uploaded successfully!')
          } catch (uploadError) {
            console.error('Video upload error:', uploadError)
            toast.error(`Failed to upload video: ${uploadError.message}`)
          }
        } else if (projectType === 'youtube' && youtubeUrl) {
          try {
            console.log('Processing YouTube URL...')
            const loadingToast = toast.loading('Processing YouTube video...')
            
            await processYouTube(project.id, youtubeUrl)
            
            toast.dismiss(loadingToast)
            toast.success('YouTube video processed successfully!')
          } catch (youtubeError) {
            console.error('YouTube processing error:', youtubeError)
            toast.error(`Failed to process YouTube video: ${youtubeError.message}`)
          }
        } else {
          toast.success('Project created successfully!')
        }

        if (onProjectCreated) {
          console.log('Calling onProjectCreated callback')
          onProjectCreated(project)
        } else {
          console.warn('onProjectCreated callback is not provided')
        }

        if (onClose) {
          onClose()
        }
      }
    } catch (error) {
      console.error('Project creation error:', error)
      toast.error(`Failed to create project: ${error.message}`)
    } finally {
      setIsCreating(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (file) => {
    // Validate file type
    const validTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/mkv',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/m4v',
      'video/3gp',
      'video/ogv'
    ]

    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid video file')
      return
    }

    // Check file size (limit to 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024 // 2GB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 2GB')
      return
    }

    setSelectedFile(file)
    toast.success(`Selected: ${file.name}`)
  }

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleYoutubeUrlChange = (url) => {
    setYoutubeUrl(url)
    
    if (url && !validateYouTubeUrl(url)) {
      toast.error('Please enter a valid YouTube URL')
    }
  }

  return {
    // Form state
    step,
    projectType,
    projectName,
    description,
    selectedFile,
    youtubeUrl,
    isCreating,
    uploadProgress,
    dragActive,
    fileInputRef,
    
    // Form actions
    setStep,
    setProjectType,
    setProjectName,
    setDescription,
    setYoutubeUrl,
    handleFileSelect,
    handleDrag,
    handleDrop,
    resetForm,
    
    // Validation
    validateYouTubeUrl,
    canProceedToNext,
    
    // Submit
    handleCreateProject
  }
}