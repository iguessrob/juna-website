'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from "next/image";
import { TrashIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMedia } from '@/context/MediaContext';
import { UploadedFile } from '@/context/MediaContext';
import { motion, AnimatePresence } from 'framer-motion';
// We might replace Masonry later depending on the exact polaroid layout needs
// import Masonry from 'react-masonry-css';

const TOTAL_SIDEBAR_NUMBERS = 12; // The total number of items in the sidebar

export default function Home() {
  const { uploadedFiles, handleDelete, isLoading } = useMedia();
  const [selectedMedia, setSelectedMedia] = useState<UploadedFile | null>(null);
  const [filter] = useState<'all' | 'images' | 'videos'>('all');
  const [visibleSidebarPage, setVisibleSidebarPage] = useState(1); // Track which sidebar numbers are visually active
  const [lightboxRotation, setLightboxRotation] = useState(0);

  const galleryRef = useRef<HTMLDivElement>(null); // Ref for the gallery container to measure scroll position

  // Effect to set random rotation for lightbox when opened
  useEffect(() => {
    if (selectedMedia) {
      // Generate a random rotation between -5 and 5 degrees
      const randomRotation = (Math.random() - 0.5) * 10;
      setLightboxRotation(randomRotation);
    } else {
      setLightboxRotation(0);
    }
  }, [selectedMedia]);

  // Filter files based on selected filter - wrapped in useMemo to prevent unnecessary recalculations
  const filteredFiles = useMemo(() => {
    return Array.isArray(uploadedFiles) ? uploadedFiles.filter(file => {
      if (filter === 'all') return true;
      if (filter === 'images') return file.type.startsWith('image/');
      if (filter === 'videos') return file.type.startsWith('video/');
      return true;
    }) : []; // Ensure filteredFiles is always an array
  }, [uploadedFiles, filter]);

  // Effect for scroll-based sidebar visibility
  useEffect(() => {
    // Check if filteredFiles is an array and not empty
    if (!galleryRef.current || isLoading || !Array.isArray(filteredFiles) || filteredFiles.length === 0) return;

    const galleryTop = galleryRef.current.offsetTop;
    const galleryHeight = galleryRef.current.scrollHeight; // Get the total scrollable height of the gallery
    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;

    // Calculate the scroll progress within the gallery container
    const scrollableHeight = galleryHeight - viewportHeight;
    const scrolledDistance = Math.max(0, scrollTop - galleryTop);

    if (scrollableHeight <= 10) {
       setVisibleSidebarPage(1);
       return;
    }

    const scrollPercentage = scrolledDistance / scrollableHeight;
    const currentPage = Math.min(TOTAL_SIDEBAR_NUMBERS, Math.floor(scrollPercentage * TOTAL_SIDEBAR_NUMBERS) + 1);

    setVisibleSidebarPage(currentPage);
  }, [isLoading, filteredFiles, filter, uploadedFiles]); // Added filteredFiles to dependencies

  // Function to scroll to a specific 'visual page' section
  const scrollToPage = (pageNumber: number) => {
    // Check if filteredFiles is an array and not empty
    if (!galleryRef.current || isLoading || !Array.isArray(filteredFiles) || filteredFiles.length === 0) return;

    const galleryTop = galleryRef.current.offsetTop;
    const galleryHeight = galleryRef.current.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollableHeight = galleryHeight - viewportHeight;

     if (scrollableHeight <= 10) return;

    const targetScrollPercentage = (pageNumber - 1) / TOTAL_SIDEBAR_NUMBERS;
    const targetScrollTop = galleryTop + scrollableHeight * targetScrollPercentage;

    window.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
     setVisibleSidebarPage(pageNumber);
  };

  // Function to generate more varied positions and rotations
  const getPolaroidStyle = (file: { url: string }) => {
    // Ensure filteredFiles is an array before using findIndex
    const filteredIndex = Array.isArray(filteredFiles) ? filteredFiles.findIndex(f => f.url === file.url) : -1;
    if (filteredIndex === -1) return {};

    const row = Math.floor(filteredIndex / 3);
    const col = filteredIndex % 3;

    const baseTop = row * 200;
    const baseLeft = col * 300;

    const topOffset = (Math.random() - 0.5) * 100;
    const leftOffset = (Math.random() - 0.5) * 100;
    const rotation = (Math.random() - 0.5) * 10;
    // Ensure filteredFiles is an array before accessing length
    const zIndex = Array.isArray(filteredFiles) ? filteredFiles.length - filteredIndex : 0;

    return {
      top: `${baseTop + topOffset}px`,
      left: `${baseLeft + leftOffset}px`,
      rotate: `${rotation}deg`,
      zIndex: zIndex,
    };
  };

  // Adjust container height based on ALL filtered files to ensure scrolling is possible
  // Ensure filteredFiles is an array before accessing length
  const containerMinHeight = `${Array.isArray(filteredFiles) ? Math.ceil(filteredFiles.length / 3) * 250 + 400 : 400}px`;

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name; // Set the desired filename
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-gray-900">
      {/* Sidebar with numbers - visually indicates scroll position and is clickable */}
      <div className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-12 text-gray-500 font-mono z-20">
        <div className="flex-grow flex flex-col justify-center space-y-2 text-xl">
          {/* Ensure filteredFiles is an array before using its length for disabling buttons */}
          {Array.from({ length: TOTAL_SIDEBAR_NUMBERS }, (_, i) => (
             <button
                key={i}
                onClick={() => scrollToPage(i + 1)} // Add click handler
                className={`transition-opacity duration-300 focus:outline-none ${ i + 1 <= visibleSidebarPage ? 'opacity-100 font-bold text-gray-900' : 'opacity-30 hover:text-gray-700'}`}
                disabled={!Array.isArray(filteredFiles) || (filteredFiles.length === 0 && i > 0)}
             >
                {(i + 1).toString().padStart(2, '0')}
              </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ml-20"> {/* Added ml-20 to make space for sidebar */}
        {/* Header section */}
        <div className="mb-12">
           {/* PROGRAMS FEBRUARY 2021 Label */}
           <div className="text-sm text-gray-600 mb-2">MATCHA</div>
           <div className="text-xs text-gray-600 mb-8">AUGUST 15</div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-extrabold mb-4 text-gray-900"
          >
            Juna&apos;s Gallery
          </motion.h1>
          <p className="text-gray-700 max-w-lg">
            Discover the beauty of Gabriel Umlas&apos;s work
          </p>
        </div>

        {/* Filter Controls - keep for now, might need restyling */}
        {/* <div className="flex justify-center gap-4 mb-12"> ... </div> */}

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(TOTAL_SIDEBAR_NUMBERS)].map((_, i) => (
              <div key={i} className="aspect-video bg-gray-300 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
           !Array.isArray(filteredFiles) || filteredFiles.length === 0 && uploadedFiles.length > 0 ? (
             <div className="text-center text-gray-600 text-lg">No media found matching the filter.</div>
           ) : !Array.isArray(filteredFiles) || filteredFiles.length === 0 && uploadedFiles.length === 0 ? (
              <div className="text-center text-gray-600 text-lg">No media uploaded yet.</div>
           ) : (
             <div className="relative" ref={galleryRef} style={{ minHeight: containerMinHeight }}>
               <AnimatePresence>
                 {/* Ensure filteredFiles is an array before mapping over it */}
                 {Array.isArray(filteredFiles) && filteredFiles.map((file) => (
                   <motion.div
                     key={`uploaded-${file.url}`}
                     initial={{ opacity: 0, scale: 0.8, y: 50 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{
                       opacity: 0,
                       scale: 0.5,
                       y: -50,
                       rotate: -15,
                       transition: {
                         duration: 0.5,
                         ease: "easeInOut"
                       }
                     }}
                     transition={{ duration: 0.4 }}
                     className="absolute bg-white p-2 shadow-xl hover:rotate-0 hover:scale-105 transition-transform duration-300 cursor-pointer origin-center group"
                     style={getPolaroidStyle(file)}
                     onClick={() => setSelectedMedia(file)}
                   >
                     <div className="relative overflow-hidden bg-gray-200" style={{ width: '250px' }}>
                       {file.type.startsWith('image/') ? (
                         <Image
                           src={file.url}
                           alt="Selected media"
                           width={250}
                           height={250}
                           className="object-contain w-full h-auto"
                           style={{ aspectRatio: 'auto' }}
                         />
                       ) : (
                         <video
                           src={file.url}
                           className="w-full h-auto"
                           controls
                           style={{ aspectRatio: 'auto' }}
                         />
                       )}

                       {/* Delete Button - Redesigned */}
                       <motion.button
                         onClick={(e: React.MouseEvent) => {
                           e.stopPropagation();
                           handleDelete(file.url);
                         }}
                         className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-600 hover:text-red-500 hover:bg-red-50 z-10"
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         aria-label="Delete file"
                       >
                         <TrashIcon className="h-5 w-5" />
                       </motion.button>

                       {/* Download Button - Redesigned to match */}
                       <motion.button
                         onClick={(e: React.MouseEvent) => {
                           e.stopPropagation();
                           // Use handleDownload function instead of creating a link
                           handleDownload(file.url, file.name);
                         }}
                         className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-600 hover:text-blue-500 hover:bg-blue-50 z-10"
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         aria-label="Download file"
                       >
                         {/* Download Icon */}
                         <ArrowDownTrayIcon className="h-5 w-5" />
                       </motion.button>
                     </div>

                     <div className="mt-2 text-sm text-gray-700 truncate px-2">
                       {new Date(file.uploadedAt).toLocaleDateString()}
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
           )
        )}

        {/* Lightbox */}
        <AnimatePresence> {/* Wrap with AnimatePresence for exit animations */}
          {selectedMedia && (
            <motion.div
              initial={{ opacity: 0 }} // Initial animation state
              animate={{ opacity: 1 }} // Animation to
              exit={{ opacity: 0 }}    // Exit animation state
              className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedMedia(null)} // Close on overlay click
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: 0 }} // Initial animation for media container with rotation
                animate={{ scale: 1, opacity: 1, rotate: lightboxRotation }}   // Animation to with random rotation
                exit={{ scale: 0.5, opacity: 0, rotate: 0 }}    // Exit animation with rotation reset
                transition={{ duration: 0.3, ease: "easeInOut" }}      // Animation duration and ease
                className="relative bg-white p-2 shadow-xl flex flex-col items-center justify-center"
                style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()} // Prevent closing when clicking on the media container
              >
                {/* Close button */}
                <button
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors z-10"
                  onClick={() => setSelectedMedia(null)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>

                {/* Media (Image or Video) */}
                <div className="relative overflow-hidden bg-gray-200" style={{ width: 'auto', height: 'auto' }}> {/* Container for media to maintain aspect ratio and match gallery item */}
                  {selectedMedia.type.startsWith('image/') ? (
                    <Image
                      src={selectedMedia.url}
                      alt="Selected media"
                      width={800} // Set a reasonable default width for the lightbox
                      height={600} // Set a reasonable default height for the lightbox
                      className="object-contain max-w-full max-h-full"
                    />
                  ) : (
                    <video
                      src={selectedMedia.url}
                      controls
                      className="object-contain max-w-full max-h-full"
                    />
                  )}
                </div>

                {/* Display Date below the media */}
                 <div className="mt-2 text-sm text-gray-700 truncate px-2">
                   {new Date(selectedMedia.uploadedAt).toLocaleDateString()}
                 </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
