'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  refreshFiles: () => Promise<void>;
  isLoading: boolean;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider = ({ children }: { children: ReactNode }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch files from the API
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setUploadedFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Function to refresh files
  const refreshFiles = async () => {
    await fetchFiles();
  };

  // Function to handle file deletion
  const handleDelete = async (fileUrl: string) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.url === fileUrl ? { ...file, isDeleting: true } : file
      )
    );

    try {
      const response = await fetch('/api/delete-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl }),
      });

      if (response.ok) {
        setTimeout(() => {
          setUploadedFiles(prev => prev.filter(file => file.url !== fileUrl));
        }, 300);
      } else {
        setUploadedFiles(prev => 
          prev.map(file => 
            file.url === fileUrl ? { ...file, isDeleting: false } : file
          )
        );
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      setUploadedFiles(prev => 
        prev.map(file => 
          file.url === fileUrl ? { ...file, isDeleting: false } : file
        )
      );
    }
  };

  return (
    <MediaContext.Provider value={{ 
      uploadedFiles, 
      setUploadedFiles, 
      handleDelete,
      refreshFiles,
      isLoading 
    }}>
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