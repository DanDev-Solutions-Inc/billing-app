import "server-only";
import { analyzeReceipt } from "@lib/ai/analyze-receipt";
import { ReceiptAnalysis } from "@interfaces/models/ai/ReceiptAnalysis";

// Fetch a private receipt blob server-side (with the store token) and run the
// AI analysis on it. Returns null when the blob can't be read or AI is off.
export const scanReceiptImage = async (
  url: string,
): Promise<ReceiptAnalysis | null> => {
  try {
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) return null;
    const mediaType = res.headers.get("content-type") ?? "";
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return await analyzeReceipt(base64, mediaType);
  } catch {
    return null;
  }
};
