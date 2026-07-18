import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getUser, isOwner } from "@lib/dal";

export const runtime = "nodejs";

/* Deliberately broad: this is the drawer an accountant asks you to fill, so it
   takes bank statements, spreadsheets, scans and the odd zip — not just the
   image formats the receipt scanner can read. Still an allowlist rather than
   "anything", so the bucket can't be used to host executables. */
const ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
  "text/csv",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
];

/**
 * Issues a short-lived, auth-gated token so the browser uploads straight to
 * Vercel Blob, bypassing the 4.5 MB serverless body limit — the same pattern as
 * the receipt uploader. Tax documents are exactly the kind of file that exceeds
 * it, so this is the only workable route rather than a nicety.
 */
export const POST = async (request: Request) => {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getUser();
        if (!user) throw new Error("Unauthorized");
        /* Writes are owner-only everywhere else in the app (the "modify own"
           policy); a shared viewer must not be able to spend the owner's
           storage either. RLS can't reach a direct-to-Blob upload, so the
           check has to happen here, at the only point we control. */
        if (!isOwner(user.email)) throw new Error("Unauthorized");
        /* The client picks the pathname, so pin it to this user's prefix —
           otherwise a crafted request could write anywhere in the store,
           including over another section's keys. */
        if (!pathname.startsWith(`documents/${user.id}/`))
          throw new Error("Invalid path");
        return {
          allowedContentTypes: ALLOWED,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      // Fires from Blob after upload; not reachable on localhost, so the rows
      // are written by the recordUploads action instead. No-op here.
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
