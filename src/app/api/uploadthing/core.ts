import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

console.log("UPLOADTHING_SECRET:", process.env.UPLOADTHING_SECRET);
console.log("UPLOADTHING_APP_ID:", process.env.UPLOADTHING_APP_ID);

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "128MB" } })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete");
      console.log("File URL:", file.url);
      console.log("File type:", file.type);
      console.log("File size:", file.size);
      return { url: file.url };
    }),

  videoUploader: f({ video: { maxFileSize: "128MB" } })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete");
      console.log("File URL:", file.url);
      console.log("File type:", file.type);
      console.log("File size:", file.size);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 