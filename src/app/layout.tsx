import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// We will import and use _clientLayout content here
import ClientLayoutContent from './_clientLayout';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Juna's Gallery",
  description: "A collection of pictures and videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Use the content from the renamed client layout */} 
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </body>
    </html>
  );
}
