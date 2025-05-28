'use client';

import { MediaProvider } from "@/context/MediaContext";
import Navbar from "@/components/Navbar";
import { ReactNode } from 'react';

export default function ClientLayoutContent({ children }: { children: ReactNode }) {
  return (
    <MediaProvider>
      <Navbar />
      {children}
    </MediaProvider>
  );
}
