'use client';

import { createContext, useContext, useState, useEffect, ReactNode, } from 'react';

interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
  isDeleting?: boolean;
}

interface MediaContextType {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  handleDelete: (fileUrl: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Load previously uploaded files from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        setUploadedFiles(parsedFiles);
      } catch (error) {
        console.error('Error parsing saved files:', error);
        localStorage.removeItem('uploadedFiles');
      }
    }
  }, []);

  // Save uploaded files to localStorage whenever they change
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles]);

  // Function to handle file deletion
  const handleDelete = async (fileUrl: string) => {
    // Mark the file as deleting to trigger animation
    setUploadedFiles(prev => 
      prev.map(file => 
        file.url === fileUrl ? { ...file, isDeleting: true } : file
      )
    );

    try {
      // Call the backend API to delete the file
      const response = await fetch('/api/delete-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl }),
      });

      if (response.ok) {
        console.log("File deleted successfully from backend:", fileUrl);
        // Remove the file from state and localStorage after animation delay
        setTimeout(() => {
          setUploadedFiles(prev => {
            const updated = prev.filter(file => file.url !== fileUrl);
            localStorage.setItem('uploadedFiles', JSON.stringify(updated));
            return updated;
          });
        }, 300); // Adjust delay to match animation duration
      } else {
        console.error("Failed to delete file from backend:", response.status, response.statusText);
        // If backend deletion fails, revert isDeleting state
        setUploadedFiles(prev => 
          prev.map(file => 
            file.url === fileUrl ? { ...file, isDeleting: false } : file
          )
        );
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      // If an error occurs, revert isDeleting state
      setUploadedFiles(prev => 
        prev.map(file => 
          file.url === fileUrl ? { ...file, isDeleting: false } : file
        )
      );
    }
  };

  return (
    <MediaContext.Provider value={{ uploadedFiles, setUploadedFiles, handleDelete }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
}; 