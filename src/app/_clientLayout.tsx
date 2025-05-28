'use client';

import { MediaProvider } from "@/context/MediaContext";
import Navbar from "@/components/Navbar";
import { ReactNode } from 'react';

export default function ClientLayoutContent({ children }: { children: ReactNode }) {
  return (
    <MediaProvider>
      <Navbar />
      {/* Main content area container */}
      <div className="flex flex-row flex-1 overflow-hidden"> {/* flex-1 makes this div fill height below Navbar, flex-row for sidebar and main content */}
        {children}
      </div>
    </MediaProvider>
  );
}
