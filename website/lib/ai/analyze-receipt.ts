import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { RECEIPT_CATEGORIES } from "@utils/constants";
import { ReceiptAnalysis } from "@interfaces/models/ai/ReceiptAnalysis";

// Claude vision only accepts these image types.
const SUPPORTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const analysisSchema = z.object({
  is_receipt: z.boolean(),
  vendor: z.string().nullable(),
  amount: z.number().nullable(),
  is_refund: z.boolean(),
  date: z.string().nullable(),
  category: z.enum(RECEIPT_CATEGORIES).nullable(),
});

const PROMPT = `You are analysing a photo of a purchase receipt or invoice for expense tracking.
Extract, as JSON:
- is_receipt: true if this image is a receipt/invoice, false otherwise.
- vendor: the merchant/company name (e.g. "Petro-Canada").
- amount: the FINAL total actually paid, including tax, as a plain POSITIVE number (e.g. 83.06).
  A zero total is valid (e.g. a free-trial invoice) — report 0, not null. Null only if unreadable.
- is_refund: true if this is a refund/return/credit (the total is negative, or it is marked
  REFUND / RETURN / CREDIT). Money is coming back rather than being spent.
- date: the transaction date as YYYY-MM-DD. Null if not shown.
- category: the single best-fitting expense category from the allowed list.`;

/**
 * Use Claude vision to read a receipt image and categorise it. Returns null when
 * no API key is configured, the media type is unsupported, or the call fails —
 * callers must degrade gracefully (the receipt still saves, just uncategorised).
 */
export const analyzeReceipt = async (
  base64: string,
  mediaType: string,
): Promise<ReceiptAnalysis | null> => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!SUPPORTED.includes(mediaType)) return null;

  try {
    const client = new Anthropic();
    const message = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      output_config: { format: zodOutputFormat(analysisSchema) },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: base64,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
    return (message.parsed_output as ReceiptAnalysis | null) ?? null;
  } catch {
    return null;
  }
};
