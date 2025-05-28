'use client';

import { useState } from 'react';
import UploadZone from "@/components/UploadZone";
import { useUploadThing } from "@/utils/uploadthing";
import { useMedia } from '@/context/MediaContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudArrowUpIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FileProgress {
  name: string;
  progress: number;
}

const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB in bytes

export default function Navbar() {
  const { setUploadedFiles } = useMedia();
  const [files, setFiles] = useState<File[]>([]);
  const { startUpload: startImageUpload, isUploading: isImageUploading } = useUploadThing("imageUploader");
  const { startUpload: startVideoUpload, isUploading: isVideoUploading } = useUploadThing("videoUploader");
  const [loading, setLoading] = useState(false);
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [fileProgressList, setFileProgressList] = useState<FileProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleUpload = async (newFiles: File[]) => {
    setError(null);
    setWarning(null);
    
    // Check file sizes
    const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      setWarning(`Warning: The following files exceed the 150MB limit and will be skipped: ${fileNames}`);
      
      // Filter out oversized files
      const validFiles = newFiles.filter(file => file.size <= MAX_FILE_SIZE);
      if (validFiles.length === 0) {
        return;
      }
      newFiles = validFiles;
    }

    setFiles(newFiles);
    setLoading(true);
    setUploadProgress(0);
    setFileProgressList(newFiles.map(file => ({ name: file.name, progress: 0 })));

    try {
      // Prompt for custom filename for each file
      const filesWithCustomNames = await Promise.all(
        newFiles.map(async (file) => {
          const defaultName = file.name;
          const customName = prompt(`Enter a name for ${defaultName} (or press OK to keep original name):`, defaultName);
          return {
            file,
            customName: customName || defaultName
          };
        })
      );

      // Separate files into images and videos
      const imageFiles = filesWithCustomNames.filter(f => f.file.type.startsWith('image/'));
      const videoFiles = filesWithCustomNames.filter(f => f.file.type.startsWith('video/'));

      // Upload images and videos separately
      const [uploadedImages, uploadedVideos] = await Promise.all([
        imageFiles.length > 0 ? startImageUpload(imageFiles.map(f => f.file)) : Promise.resolve([]),
        videoFiles.length > 0 ? startVideoUpload(videoFiles.map(f => f.file)) : Promise.resolve([])
      ]);

      const allUploaded = [...(uploadedImages || []), ...(uploadedVideos || [])];
      
      if (allUploaded.length > 0) {
        // Update progress for each file
        filesWithCustomNames.forEach((_, index) => {
          setTimeout(() => {
            setFileProgressList(prev => {
              const newFiles = [...prev];
              newFiles[index] = { ...newFiles[index], progress: 100 };
              return newFiles;
            });
            setUploadProgress(((index + 1) / filesWithCustomNames.length) * 100);
          }, index * 500);
        });

        setUploadedFiles(prev => {
          const newUploaded = allUploaded.map((file, index) => ({
            url: file.url,
            name: filesWithCustomNames[index].customName,
            type: file.type || '',
            size: file.size || 0,
            isDeleting: false,
          }));
          return [...prev, ...newUploaded];
        });

        // Wait for progress animation to complete before closing
        setTimeout(() => {
          setShowUploadPreview(false);
        }, filesWithCustomNames.length * 500 + 500);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("An error occurred while uploading files. Please try again.");
    } finally {
      setLoading(false);
      setFiles([]);
      setUploadProgress(0);
      setFileProgressList([]);
    }
  };

  const handleCloseModal = () => {
    if (!isImageUploading && !isVideoUploading && !loading) {
      setShowUploadPreview(false);
      setError(null);
      setWarning(null);
    }
  };

  const isUploading = isImageUploading || isVideoUploading;

  return (
    <nav className="bg-gray-100/30 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-semibold text-gray-800"
          >
            Juna's Gallery
          </motion.h1>

          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onClick={() => setShowUploadPreview(true)}
            >
              <CloudArrowUpIcon className="h-5 w-5" />
              <span>Upload</span>
            </motion.button>

            <AnimatePresence>
              {(isImageUploading || isVideoUploading || loading) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center space-x-2 text-sm text-gray-500"
                >
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  <span>{isImageUploading || isVideoUploading ? 'Uploading...' : 'Processing...'}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Upload Preview Modal */}
      <AnimatePresence>
        {showUploadPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-3xl relative text-gray-900 flex flex-col items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                disabled={isImageUploading || isVideoUploading || loading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="flex flex-col items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Media</h2>
                <p className="text-base text-gray-600 text-center">
                  {isImageUploading || isVideoUploading ? 'Uploading your files... Please wait.' : 'Drag and drop your images or videos here, or click to browse.'}
                </p>
                <p className="text-sm text-gray-500 mt-2">Maximum file size: 150MB</p>
              </div>

              {!isImageUploading && !isVideoUploading && !loading ? (
                <>
                  {warning && (
                    <div className="w-full mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                        <p className="text-sm text-yellow-700">{warning}</p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 transition-colors duration-200 hover:border-gray-400 mb-6 w-full">
                    <UploadZone onUpload={handleUpload} />
                  </div>
                </>
              ) : (
                <div className="w-full space-y-4 mb-6">
                  {/* Overall Progress */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <motion.div
                      className="bg-blue-600 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  
                  {/* Individual File Progress */}
                  <div className="space-y-2">
                    {fileProgressList.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <motion.div
                            className="bg-green-600 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="flex items-center space-x-1 min-w-[100px]">
                          {file.progress === 100 ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          )}
                          <span className="text-sm text-gray-600 truncate">{file.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancel button - restyled and centered */}
              <div className="flex justify-center">
                <button
                  onClick={handleCloseModal}
                  disabled={isImageUploading || isVideoUploading || loading}
                  className={`px-6 py-3 rounded-lg transition-colors duration-200 ${
                    isImageUploading || isVideoUploading || loading
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                  }`}
                >
                  Cancel Upload
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}