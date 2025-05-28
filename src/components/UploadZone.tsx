import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, HTMLMotionProps } from 'framer-motion';
import { CloudArrowUpIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
}

const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB in bytes

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov']
    }
  });

  const rootProps = getRootProps() as HTMLMotionProps<"div">;

  return (
    <motion.div
      {...rootProps}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
        ${isDragActive 
          ? 'border-blue-500 bg-blue-500/10 scale-105' 
          : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <motion.div
          animate={{ 
            y: isDragActive ? [0, -10, 0] : 0,
            scale: isDragActive ? 1.1 : 1
          }}
          transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
        >
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
        </motion.div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-white">
            {isDragActive ? 'Drop your files here' : 'Drag & drop your files here'}
          </p>
          <p className="text-sm text-gray-400">
            or click to browse
          </p>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <PhotoIcon className="h-4 w-4" />
            <span>Images</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <VideoCameraIcon className="h-4 w-4" />
            <span>Videos</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Supported formats: PNG, JPG, GIF, MP4, WebM, MOV
          <br />
          Maximum file size: 150MB
        </div>
      </div>

      {/* Drag Active Overlay */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-500/10 rounded-xl"
        />
      )}
    </motion.div>
  );
} 