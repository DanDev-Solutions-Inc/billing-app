import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getUser } from "@lib/dal";

export const runtime = "nodejs";

// Issues a short-lived, auth-gated token so the browser can upload the receipt
// image straight to Vercel Blob (bypassing the 4.5 MB serverless body limit).
export const POST = async (request: Request) => {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getUser();
        if (!user) throw new Error("Unauthorized");
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      // Fires from Blob after upload; not reachable on localhost, so the DB row
      // is written by the createReceipt action instead. No-op here.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
};
