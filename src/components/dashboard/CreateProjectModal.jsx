import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as XIcon, Loader as LoaderIcon, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useCreateProjectModal } from '../../hooks/useCreateProjectModal';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../../stores/projectStore';
import {
  ProjectTypeStep,
  ProjectDetailsStep,
  YouTubeUrlStep,
  VideoUploadStep,
} from '../project/steps';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const navigate = useNavigate();
  const { uploadProgress, isLoading } = useProjectStore();
  const [isUploading, setIsUploading] = useState(false);

  const {
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
    setStep,
    setProjectType,
    setProjectName,
    setDescription,
    setYoutubeUrl,
    resetForm,
    handleFileSelect,
    handleDrag,
    handleDrop,
    validateYouTubeUrl,
    handleCreateProject,
    canProceedToNext,
    nextStep,
    prevStep,
  } = useCreateProjectModal();

  if (!isOpen) return null;

  const steps = [
    { id: 1, title: 'Project Type' },
    { id: 2, title: 'Details' },
    { id: 3, title: projectType === 'youtube' ? 'YouTube URL' : 'Upload Video' },
  ];

  const handleClose = () => {
    resetForm();
    setIsUploading(false);
    onClose();
  };

  const handleCreate = async () => {
    try {
      if (selectedFile) {
        setIsUploading(true);
      }

      const createdProject = await handleCreateProject(
        (project) => {
          console.log('Project creation callback called with:', project);
        },
        null // Don't auto-close
      );

      if (createdProject && createdProject.id) {
        console.log('Navigating to project:', createdProject.id);
        navigate(`/projects/${createdProject.id}`);
        handleClose();
        if (onProjectCreated) {
          onProjectCreated(createdProject);
        }
      } else {
        console.error('Invalid project returned:', createdProject);
        setError('Failed to create project. Please try again.');
      }
    } catch (error) {
      console.error('Project creation failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ProjectTypeStep
            projectType={projectType}
            setProjectType={setProjectType}
            error={errors.projectType}
          />
        );
      case 2:
        return (
          <ProjectDetailsStep
            projectName={projectName}
            setProjectName={setProjectName}
            description={description}
            setDescription={setDescription}
            errors={errors}
          />
        );
      case 3:
        if (projectType === 'youtube') {
          return (
            <YouTubeUrlStep
              youtubeUrl={youtubeUrl}
              setYoutubeUrl={setYoutubeUrl}
              error={errors.youtubeUrl}
            />
          );
        } else {
          return (
            <VideoUploadStep
              selectedFile={selectedFile}
              handleFileSelect={handleFileSelect}
              dragActive={dragActive}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              fileInputRef={fileInputRef}
              error={errors.selectedFile}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
            />
          );
        }
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-prism rounded-2xl shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">Create New Project</h3>
          <button
            onClick={handleClose}
            className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= stepItem.id ? 'bg-primary-500 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {step > stepItem.id ? <Check className="w-4 h-4" /> : stepItem.id}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    step >= stepItem.id ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {stepItem.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-4 h-px w-8 transition-colors ${
                      step > stepItem.id ? 'bg-primary-500' : 'bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

          {/* Upload Progress */}
          {(isUploading || uploadProgress > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-400">
                  {uploadProgress < 100 ? 'Uploading video...' : 'Processing...'}
                </span>
                <span className="text-sm text-blue-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {errors.general && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {errors.general}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <button
            onClick={prevStep}
            disabled={step === 1 || isCreating || isUploading}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isCreating || isUploading}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                onClick={nextStep}
                disabled={!canProceedToNext || isCreating || isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={!canProceedToNext || isCreating || isUploading || uploadProgress > 0}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating || isUploading || uploadProgress > 0 ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isUploading ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateProjectModal;
