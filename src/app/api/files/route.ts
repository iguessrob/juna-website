import { NextResponse } from 'next/server';
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function GET() {
  try {
    // Get all files from UploadThing using the UTApi
    const files = await utapi.listFiles();
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
} 