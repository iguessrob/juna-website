import { NextResponse } from 'next/server';
import { getUploadthingUrl } from 'uploadthing/server';

export async function GET() {
  try {
    // Get all files from UploadThing
    const files = await getUploadthingUrl();
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
} 