import { NextResponse } from 'next/server';
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function GET() {
  try {
    // Get all files from UploadThing using the UTApi
    const filesData = await utapi.listFiles();
    console.log("Files fetched from UploadThing:", filesData);

    // Extract keys from filesData
    const fileKeys = filesData.files.map(file => file.key);

    // Get URLs for all files using their keys
    const fileUrlsResponse = await utapi.getFileUrls(fileKeys);

    // Create a map from file key to URL
    const fileUrlsMap: { [key: string]: string } = {};
    if (fileUrlsResponse.data) {
      fileUrlsResponse.data.forEach(item => {
        fileUrlsMap[item.key] = item.url;
      });
    }

    // Map over the files and add the corresponding URL and determined type
    const filesWithUrls = filesData.files.map(file => ({
      ...file,
      url: fileUrlsMap[file.key], // Get the URL from the map
      // Determine type based on extension
      type: file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.ogg') ? 'video/' + file.name.split('.').pop() : 'image/' + file.name.split('.').pop()
    }));
    
    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
} 