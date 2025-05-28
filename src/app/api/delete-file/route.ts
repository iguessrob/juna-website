import { UTApi } from "uploadthing/server";
import { NextResponse } from 'next/server';

// Initialize UTApi with your secret key
const utapi = new UTApi();

export async function POST(request: Request) {
  try {
    const { fileUrl } = await request.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 });
    }

    // Extract the file key from the URL (UploadThing uses the key for deletion)
    // The URL typically looks like: https://utfs.io/f/YOUR_FILE_KEY
    const urlParts = fileUrl.split('/');
    const fileKey = urlParts[urlParts.length - 1];

    if (!fileKey) {
        return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    console.log("Attempting to delete file with key:", fileKey);

    // Delete the file using UTApi
    const deleteResult = await utapi.deleteFiles(fileKey);

    console.log("Delete result:", deleteResult);

    if (deleteResult.success) {
       return NextResponse.json({ message: "File deleted successfully" }, { status: 200 });
    } else {
       // Handle cases where UploadThing reports deletion failed but doesn't throw
       console.error("UploadThing reported deletion failed:", deleteResult);
       return NextResponse.json({ error: "Failed to delete file from storage" }, { status: 500 });
    }

  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 