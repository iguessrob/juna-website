import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  onError: (error) => {
    console.error("UploadThing API Error:", error);
  },
}); 