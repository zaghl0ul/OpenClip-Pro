import React from 'react'
import { motion } from 'framer-motion'
import { Upload as UploadIcon, FileText as FileTextIcon } from 'lucide-react'

const VideoUploadStep = ({ 
  selectedFile, 
  handleFileSelect, 
  dragActive, 
  handleDrag, 
  handleDrop, 
  fileInputRef 
}) => {
  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-2">
          Upload Video
        </h3>
        <p className="text-gray-400">
          Select a video file from your device
        </p>
      </div>
      
      {selectedFile ? (
        <div className="p-6 border border-gray-700 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400">
              <FileTextIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-100 truncate">{selectedFile.name}</h4>
              <p className="text-sm text-gray-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => handleFileSelect(null)}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <div className={`p-4 rounded-full ${
              dragActive ? 'bg-primary-500/20' : 'bg-gray-700/50'
            }`}>
              <UploadIcon className={`w-8 h-8 ${
                dragActive ? 'text-primary-400' : 'text-gray-400'
              }`} />
            </div>
            
            <div>
              <p className="text-gray-300 mb-2">
                {dragActive ? 'Drop your file here' : 'Drag & drop your video file here'}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Supports MP4, MOV, AVI, and other common formats
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0])
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default VideoUploadStep