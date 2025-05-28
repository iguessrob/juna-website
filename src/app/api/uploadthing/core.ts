import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// Ensure environment variables are set
if (!process.env.UPLOADTHING_SECRET || !process.env.UPLOADTHING_APP_ID) {
  throw new Error("Missing UploadThing environment variables");
}

console.log("UPLOADTHING_SECRET:", process.env.UPLOADTHING_SECRET);
console.log("UPLOADTHING_APP_ID:", process.env.UPLOADTHING_APP_ID);

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "128MB" } })
    .middleware(async () => {
      // Ensure we have the necessary permissions
      return { userId: "public" };
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete for image");
      console.log("File URL:", file.ufsUrl);
      return { url: file.ufsUrl, name: file.name, type: file.type, size: file.size };
    }),

  videoUploader: f({ video: { maxFileSize: "128MB" } })
    .middleware(async () => {
      // Ensure we have the necessary permissions
      return { userId: "public" };
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete for video");
      console.log("File URL:", file.ufsUrl);
      return { url: file.ufsUrl, name: file.name, type: file.type, size: file.size };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 