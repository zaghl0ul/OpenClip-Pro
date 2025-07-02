import React, { useState } from 'react';

import { useCreateProjectModal } from '../../hooks/useCreateProjectModal';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../../stores/projectStore';
import { ScaleIn, MotionButton, AnimatePresence } from '../Common/LightweightMotion';
import {
  ProjectTypeStep,
  ProjectDetailsStep,
  YouTubeUrlStep,
  VideoUploadStep,
} from '../project/steps';
import { XIcon, CheckIcon, ArrowLeftIcon, ArrowRightIcon } from '../Common/icons';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const navigate = useNavigate();
  const { uploadProgress } = useProjectStore();
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
    setProjectType,
    setProjectName,
    setDescription,
    setYoutubeUrl,
    resetForm,
    handleFileSelect,
    handleDrag,
    handleDrop,
    handleCreateProject,
    canProceedToNext,
    nextStep,
    prevStep,
    setErrors,
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
        null, // Don't auto-close
        null // Don't auto-close
      );

      if (createdProject && createdProject.id) {
        navigate(`/projects/${createdProject.id}`);
        handleClose();
        if (onProjectCreated) {
          onProjectCreated(createdProject);
        }
      } else {
        setErrors({ ...errors, general: 'Failed to create project. Please try again.' });
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <ScaleIn className="glass-prism rounded-2xl shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">Create New Project</h3>
          <MotionButton
            onClick={handleClose}
            className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <XIcon size={20} className="w-5 h-5" />
          </MotionButton>
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
                  {step > stepItem.id ? <CheckIcon size={16} className="w-4 h-4" /> : stepItem.id}
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
          <AnimatePresence>{renderStep()}</AnimatePresence>

          {/* Upload Progress */}
          {(isUploading || uploadProgress > 0) && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-400">
                  {uploadProgress < 100 ? 'Uploading video...' : 'Processing...'}
                </span>
                <span className="text-sm text-blue-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
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
          <MotionButton
            onClick={prevStep}
            disabled={step === 1 || isCreating || isUploading}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeftIcon size={16} className="w-4 h-4" />
            Previous
          </MotionButton>

          <div className="flex gap-3">
            <MotionButton
              onClick={handleClose}
              disabled={isCreating || isUploading}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </MotionButton>

            {step < 3 ? (
              <MotionButton
                onClick={nextStep}
                disabled={!canProceedToNext || isCreating || isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Next
                <ArrowRightIcon size={16} className="w-4 h-4" />
              </MotionButton>
            ) : (
              <MotionButton
                onClick={handleCreate}
                disabled={!canProceedToNext || isCreating || isUploading || uploadProgress > 0}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCreating || isUploading || uploadProgress > 0 ? (
                  <>
                    <div size={16} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isUploading ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <CheckIcon size={16} className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </MotionButton>
            )}
          </div>
        </div>
      </ScaleIn>
    </div>
  );
};

export default CreateProjectModal; 