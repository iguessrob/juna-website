import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
// We will import and use _clientLayout content here
import ClientLayoutContent from './_clientLayout';
import { MediaProvider } from '@/context/MediaContext';

const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair-display' });
const sourceSansPro = Source_Sans_3({ subsets: ["latin"], weight: ['400', '700'], variable: '--font-source-sans-pro' });

export const metadata: Metadata = {
  title: "Juna's Gallery",
  description: "A collection of pictures and videos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${sourceSansPro.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        <MediaProvider>
          {/* Use the content from the renamed client layout */} 
          <ClientLayoutContent>{children}</ClientLayoutContent>
        </MediaProvider>
      </body>
    </html>
  );
}
