import React from 'react';
import { UploadIcon, CheckCircleIcon, FileTextIcon } from '../../Common/icons';
import { 
  TrendingUpIcon, SparklesIcon, BrainIcon, XIcon, VideoIcon, SettingsIcon, 
  LoaderIcon, ZapIcon, ActivityIcon, CheckCircleIcon, PlayIcon, EyeIcon,
  AlertTriangleIcon, XCircleIcon, RefreshCwIcon, ClockIcon, CheckIcon,
  AlertCircleIcon, LinkIcon, TrashIcon, PlusIcon, SearchIcon, Grid3X3Icon,
  ListIcon, ArrowRightIcon, ChevronRightIcon, UploadIcon, DownloadIcon,
  ShareIcon, FileTextIcon, MoreVerticalIcon, EditIcon, UserIcon, BellIcon,
  HelpCircleIcon, MenuIcon, FolderIcon, FilmIcon, TargetIcon, PaletteIcon,
  VolumeXIcon, Volume2Icon, SkipBackIcon, SkipForwardIcon, PauseIcon,
  MaximizeIcon, ScissorsIcon, LayersIcon, TrendingDownIcon, StarIcon,
  MailIcon, SendIcon, UsersIcon, MessageSquareIcon, HomeIcon, YoutubeIcon,
  BarChart2Icon, KeyIcon, ShieldIcon, ArrowLeftIcon
} from '../Common/icons';

const VideoUploadStep = ({
  selectedFile,
  handleFileSelect,
  dragActive,
  handleDrag,
  handleDrop,
  fileInputRef,
  error,
  uploadProgress = 0,
  isUploading = false,
}) => {
  // Ensure we're handling file selection correctly
  const onFileChange = (e) => {
    if (e.target.files?.[0]) {
      // Pass the actual File object, not an array
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Upload Video</h3>
        <p className="text-gray-400">Select a video file from your device</p>
      </div>

      {selectedFile ? (
        <div className="p-6 border border-gray-700 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400">
              {isUploading ? (
                <div size={24} className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              ) : uploadProgress === 100 ? (
                <CheckCircleIcon size={24} className="w-6 h-6 text-green-400" />
              ) : (
                <FileTextIcon size={24} className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-100 truncate">{selectedFile.name}</h4>
              <p className="text-sm text-gray-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                    </span>
                    <span className="text-xs text-gray-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            {!isUploading && (
              <button
                onClick={() => handleFileSelect(null)}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Change
              </button>
            )}
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
            <div
              className={`p-4 rounded-full ${dragActive ? 'bg-primary-500/20' : 'bg-gray-700/50'}`}
            >
              <UploadIcon
                className={`w-8 h-8 ${dragActive ? 'text-primary-400' : 'text-gray-400'}`}
              />
            </div>

            <div>
              <p className="text-gray-300 mb-2">
                {dragActive ? 'Drop your file here' : 'Drag & drop your video file here'}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Supports MP4, MOV, AVI, and other common formats (max 500MB)
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
                onChange={onFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default VideoUploadStep;
