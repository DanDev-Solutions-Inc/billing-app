import { NextResponse } from "next/server";
import { getUser } from "@lib/dal";
import { scanReceiptImage } from "@lib/receipts/scan";

export const runtime = "nodejs";
// Reading a receipt with AI takes longer than the default budget.
export const maxDuration = 60;

/**
 * Read an already-uploaded receipt (image or PDF) and return what it says, so
 * the form can pre-fill itself before the user saves. Auth-gated: the blob is
 * private and only ever fetched server-side with the store token.
 */
export const POST = async (request: Request) => {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = (await request.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Only read blobs from our own store — never fetch an arbitrary URL on behalf
  // of a caller (SSRF).
  if (!/^https:\/\/[a-z0-9]+\.(public|private)\.blob\.vercel-storage\.com\//i.test(url))
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });

  const analysis = await scanReceiptImage(url);
  return NextResponse.json({ analysis });
};
