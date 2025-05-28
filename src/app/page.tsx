'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from "next/image";
import { TrashIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useMedia } from '@/context/MediaContext';
import { motion, AnimatePresence } from 'framer-motion';
// We might replace Masonry later depending on the exact polaroid layout needs
// import Masonry from 'react-masonry-css';

const TOTAL_SIDEBAR_NUMBERS = 12; // The total number of items in the sidebar

export default function Home() {
  const { uploadedFiles, handleDelete } = useMedia();
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleSidebarPage, setVisibleSidebarPage] = useState(1); // Track which sidebar numbers are visually active
  // const [exitingItems, setExitingItems] = useState<string[]>([]); // Remove exitingItems state

  const galleryRef = useRef<HTMLDivElement>(null); // Ref for the gallery container to measure scroll position

  useEffect(() => {
    // Simulate initial loading state
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter files based on selected filter
  const filteredFiles = uploadedFiles.filter(file => {
    if (filter === 'all') return true;
    if (filter === 'images') return file.type.startsWith('image/');
    if (filter === 'videos') return file.type.startsWith('video/');
    return true;
  });

  // Effect for scroll-based sidebar visibility
  useEffect(() => {
    const handleScroll = () => {
      if (!galleryRef.current || isLoading || filteredFiles.length === 0) return;

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
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isLoading, filteredFiles.length, filter]);

  // Function to scroll to a specific 'visual page' section
  const scrollToPage = (pageNumber: number) => {
    if (!galleryRef.current || isLoading || filteredFiles.length === 0) return;

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
  const getPolaroidStyle = (file: any, index: number) => {
    // Positioning logic based on the index within the *filtered* files array
    const filteredIndex = filteredFiles.findIndex(f => f.url === file.url);
    if (filteredIndex === -1) return {}; 

    const row = Math.floor(filteredIndex / 3); 
    const col = filteredIndex % 3; 
    
    const baseTop = row * 200; 
    const baseLeft = col * 300; 
    
    const topOffset = (Math.random() - 0.5) * 100; 
    const leftOffset = (Math.random() - 0.5) * 100; 
    const rotation = (Math.random() - 0.5) * 10; 
    const zIndex = filteredFiles.length - filteredIndex; 

    return {
      top: `${baseTop + topOffset}px`,
      left: `${baseLeft + leftOffset}px`,
      rotate: `${rotation}deg`,
      zIndex: zIndex,
    };
  };

  // Adjust container height based on ALL filtered files to ensure scrolling is possible
  const containerMinHeight = `${Math.ceil(filteredFiles.length / 3) * 250 + 400}px`;

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-gray-900">
      {/* Sidebar with numbers - visually indicates scroll position and is clickable */}
      <div className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-12 text-gray-500 font-mono z-20">
        <div className="flex-grow flex flex-col justify-center space-y-2 text-xl">
          {Array.from({ length: TOTAL_SIDEBAR_NUMBERS }, (_, i) => (
             <button 
                key={i} 
                onClick={() => scrollToPage(i + 1)} // Add click handler
                className={`transition-opacity duration-300 focus:outline-none ${ i + 1 <= visibleSidebarPage ? 'opacity-100 font-bold text-gray-900' : 'opacity-30 hover:text-gray-700'}`}
                disabled={filteredFiles.length === 0 && i > 0}
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
            Juna's Gallery
          </motion.h1>
          <p className="text-gray-700 max-w-lg">
            {/* Placeholder for a shorter description to match the reference image */}
            Discover the beauty of Gabriel Umlas
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
           filteredFiles.length === 0 && uploadedFiles.length > 0 ? (
             <div className="text-center text-gray-600 text-lg">No media found matching the filter.</div>
           ) : filteredFiles.length === 0 && uploadedFiles.length === 0 ? (
              <div className="text-center text-gray-600 text-lg">No media uploaded yet.</div>
           ) : (
             <div className="relative" ref={galleryRef} style={{ minHeight: containerMinHeight }}>
               <AnimatePresence>
                 {filteredFiles.map((file, index) => (
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
                     style={getPolaroidStyle(file, index)}
                     onClick={() => setSelectedMedia(file.url)}
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
                         onClick={(e) => {
                           e.stopPropagation();
                           const link = document.createElement('a');
                           link.href = file.url;
                           link.download = file.name;
                           document.body.appendChild(link);
                           link.click();
                           document.body.removeChild(link);
                         }}
                         className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-600 hover:text-blue-500 hover:bg-blue-50 z-10"
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         aria-label="Download file"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                         </svg>
                       </motion.button>
                     </div>
                     <div className="mt-2 text-sm text-gray-700 truncate px-2">
                       {file.name}
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
           )
        )}

        {/* Lightbox - keep for now, might need restyling */}
        {selectedMedia && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={() => setSelectedMedia(null)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
              {selectedMedia.startsWith('data:image') ? (
                <Image
                  src={selectedMedia}
                  alt="Selected media"
                  fill
                  className="object-contain"
                />
              ) : (
                <video
                  src={selectedMedia}
                  controls
                  className="max-w-full max-h-[90vh]"
                />
              )}
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
