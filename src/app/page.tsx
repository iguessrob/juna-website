'use client';

import { useState } from 'react';
import Image from "next/image";
import UploadZone from "@/components/UploadZone";
import { useUploadThing } from "@/utils/uploadthing";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const { startUpload, isUploading } = useUploadThing("imageUploader");

  const handleUpload = async (newFiles: File[]) => {
    setFiles(newFiles);
    try {
      const uploadedFiles = await startUpload(newFiles);
      console.log("Uploaded files:", uploadedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">My Picture & Video Collection</h1>
        
        <div className="mb-8">
          <UploadZone onUpload={handleUpload} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
              {file.type.startsWith('image/') ? (
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`Uploaded image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <video
                  src={URL.createObjectURL(file)}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
