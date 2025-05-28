'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from "next/image";
import { TrashIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMedia } from '@/context/MediaContext';
import { UploadedFile } from '@/context/MediaContext';
import { motion, AnimatePresence } from 'framer-motion';
// import useLocomotiveScroll from '@/hooks/useLocomotiveScroll'; // Removed Locomotive Scroll
// We might replace Masonry later depending on the exact polaroid layout needs
// import Masonry from 'react-masonry-css';

export default function Home() {
  const { uploadedFiles, handleDelete, isLoading } = useMedia();
  const [selectedMedia, setSelectedMedia] = useState<UploadedFile | null>(null);
  const [filter] = useState<'all' | 'images' | 'videos'>('all');
  const [visibleSidebarPage, setVisibleSidebarPage] = useState(1); // Track which sidebar numbers are visually active
  const [lightboxRotation, setLightboxRotation] = useState(0);

  // Create a ref for the main scrollable content area
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Use the custom hook and get the scroll ref
  // const { scrollRef, scroll } = useLocomotiveScroll(); // Removed Locomotive Scroll

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

  // Effect to update visible sidebar page based on scroll position
  useEffect(() => {
    const mainContentEl = mainContentRef.current;
    if (!mainContentEl) return;

    const handleScroll = () => {
      const itemsPerPage = 6; // Should match the itemsPerPage used elsewhere
      const mainContentEl = mainContentRef.current;
      if (!mainContentEl) return;

      const containerTop = mainContentEl.getBoundingClientRect().top;
      const itemElements = mainContentEl.querySelectorAll('[data-scroll-id]');

      if (itemElements.length === 0) return;

      let firstVisibleItemIndex = 0;

      // Find the index of the first item that is at or near the top of the visible container area
      for (let i = 0; i < itemElements.length; i++) {
        const item = itemElements[i] as HTMLElement;
        const itemTop = item.getBoundingClientRect().top;

        // We consider an item visible if its top is at or above the container's top, with a small tolerance
        if (itemTop <= containerTop + 10) { // Add a small tolerance of 10px
          firstVisibleItemIndex = i;
          // To ensure we get the index of the *first* fully visible item, we might need a slightly more complex check,
          // but this should be a good starting point. Break once the first candidate is found.
          break;
        }
         // If we scrolled past this item, and it's below the container top even with tolerance,
        // the next item must be the first visible one.
        if (i > 0 && itemTop > containerTop + 10) {
             firstVisibleItemIndex = i; // This item is now the first visible
             break;
        }
      }

      // Calculate the current page number (1-indexed)
      const currentPage = Math.floor(firstVisibleItemIndex / itemsPerPage) + 1;

      // Update the visible sidebar page if it's different
      if (currentPage !== visibleSidebarPage) {
        setVisibleSidebarPage(currentPage);
      }
    };

    // Attach the scroll event listener
    mainContentEl.addEventListener('scroll', handleScroll);

    // Clean up the event listener on component unmount
    return () => {
      mainContentEl.removeEventListener('scroll', handleScroll);
    };
  }, [filteredFiles, visibleSidebarPage]); // Re-run effect if filteredFiles or visibleSidebarPage changes

  // Function to scroll to a specific 'visual page' section
  const scrollToPage = (pageNumber: number) => {
    // Check if filteredFiles is an array and not empty
    if (isLoading || !Array.isArray(filteredFiles) || filteredFiles.length === 0) return;

    // Calculate the index of the first item on the target page
    const itemsPerPage = 6; // Changed from 3 to 6 items per page
    const targetIndex = (pageNumber - 1) * itemsPerPage;

    console.log(`Attempting to scroll to page ${pageNumber}, targetIndex: ${targetIndex}`);

    // Get the ref for the target element using standard DOM
    const targetElement = document.querySelector(`[data-scroll-id="item-${targetIndex}"]`);

    console.log('Target element found:', targetElement);

    if (pageNumber === 1) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else if (targetElement) {
      // Add offset to ensure proper page separation
      const offset = 100; // Add some space between pages
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      // Fallback if target element is not found, scroll to bottom
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }

    setVisibleSidebarPage(pageNumber);
  };

  // Function to generate more varied positions and rotations
  const getPolaroidStyle = (file: { url: string }) => {
    // Ensure filteredFiles is an array before using findIndex
    const filteredIndex = Array.isArray(filteredFiles) ? filteredFiles.findIndex(f => f.url === file.url) : -1;
    if (filteredIndex === -1) return {};

    const rotation = (Math.random() - 0.5) * 10;
    const zIndex = Array.isArray(filteredFiles) ? filteredFiles.length - filteredIndex : 0;

    return {
      rotate: `${rotation}deg`,
      zIndex: zIndex,
    };
  };

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

  // Function to check if a page has images
  const pageHasImages = (pageNumber: number) => {
    if (!Array.isArray(filteredFiles) || filteredFiles.length === 0) return false;
    
    const itemsPerPage = 6; // Changed from 3 to 6 items per page
    const startIndex = (pageNumber - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Check if there are any images in this page range
    return filteredFiles.slice(startIndex, endIndex).some(file => file.type.startsWith('image/'));
  };

  // Calculate total pages needed based on filtered files and items per page
  const itemsPerPage = 6; // Should match the itemsPerPage used in scrollToPage and pageHasImages
  const totalPages = filteredFiles && filteredFiles.length > 0 ? Math.ceil(filteredFiles.length / itemsPerPage) : 1; // Ensure at least 1 page if no files

  return (
    <>
      {/* Sidebar with numbers - visually indicates scroll position and is clickable */}
      <div className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-12 text-[#8ba888] font-mono z-20 hidden md:flex">
        <div className="flex-grow flex flex-col justify-center space-y-2 text-xl">
          {/* Render buttons only for pages that are in use */}
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNumber = i + 1;
            const hasImages = pageHasImages(pageNumber);
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => scrollToPage(pageNumber)}
                className={`transition-opacity duration-300 focus:outline-none ${
                  i + 1 <= visibleSidebarPage ? 'opacity-100 font-bold text-[--foreground]' : 'opacity-30 hover:text-[--muted-text]'
                } ${!hasImages ? 'cursor-not-allowed opacity-20' : ''}`}
                disabled={!hasImages || !Array.isArray(filteredFiles) || (filteredFiles.length === 0 && i > 0)}
              >
                {(i + 1).toString().padStart(2, '0')}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main scrollable content */}
      <div
        className="flex-grow w-full md:w-0 bg-[#f1ebe1] text-[#44624a] h-full overflow-y-auto min-h-screen"
        ref={mainContentRef}
      >
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
          {/* Header section */}
          <div className="mb-8 md:mb-12">
            {/* PROGRAMS FEBRUARY 2021 Label */}
            <div className="text-sm text-[#8ba888] mb-2">MATCHA</div>
            <div className="text-xs text-[#8ba888] mb-4 md:mb-8">AUGUST 15</div>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-extrabold mb-4 text-[#44624a]"
            >
              Juna&apos;s Gallery
            </motion.h1>
            <p className="text-[#8ba888] max-w-lg text-sm md:text-base">
              Discover the beauty of Gabriel Umlas&apos;s work
            </p>
          </div>

          {/* Grid of polaroids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.url}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative aspect-square cursor-pointer bg-white p-3 md:p-5 shadow-lg transform transition-transform hover:scale-105 group hover:shadow-xl"
                onClick={() => setSelectedMedia(file)}
                data-scroll-id={`item-${index}`}
                style={getPolaroidStyle(file)}
              >
                <div className="relative overflow-hidden bg-white p-1 border border-[--border-color] flex items-center justify-center w-full h-full">
                  {file.type.startsWith('image/') ? (
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-contain absolute top-0 left-0 w-full h-full"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : file.type.startsWith('video/') ? (
                    <video
                      src={file.url}
                      className="object-contain absolute top-0 left-0 w-full h-full"
                      controls
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : null}

                  {/* Delete Button */}
                  <motion.button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDelete(file.url);
                    }}
                    className="absolute top-2 right-2 bg-[#ffffff]/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 text-[#8ba888] hover:text-red-500 hover:bg-red-50 z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Delete file"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </motion.button>

                  {/* Download Button */}
                  <motion.button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDownload(file.url, file.name);
                    }}
                    className="absolute bottom-2 right-2 bg-[#ffffff]/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 text-[#8ba888] hover:text-blue-500 hover:bg-blue-50 z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Download file"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </motion.button>
                </div>
                 <div className="mt-2 text-sm text-[#8ba888] truncate px-2">
                   {new Date(file.uploadedAt).toLocaleDateString()}
                 </div>
              </motion.div>
            ))}
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="relative aspect-square bg-white p-3 md:p-5 shadow-lg animate-pulse"
                >
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    {/* Optional: Add a placeholder icon or text */}
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, rotate: lightboxRotation }}
              animate={{ scale: 1, rotate: lightboxRotation }}
              exit={{ scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh] bg-white p-2 md:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
              
              {selectedMedia.type.startsWith('image/') ? (
                <div className="relative w-full h-full">
                  <Image
                    src={selectedMedia.url}
                    alt={selectedMedia.name}
                    width={800}
                    height={800}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                </div>
              ) : selectedMedia.type.startsWith('video/') ? (
                <video
                  src={selectedMedia.url}
                  className="max-w-full max-h-[80vh]"
                  controls
                  autoPlay
                />
              ) : null}

              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">{selectedMedia.name}</span>
                <button
                  onClick={() => handleDownload(selectedMedia.url, selectedMedia.name)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
