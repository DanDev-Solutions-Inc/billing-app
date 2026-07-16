import "server-only";
import { put } from "@vercel/blob";
import { analyzeReceipt } from "@lib/ai/analyze-receipt";
import { SupabaseClient } from "@typings/SupabaseClient";
import { IngestAttachmentInput } from "@interfaces/services/IngestAttachmentInput";

/**
 * Turn one emailed attachment into a receipt (+ its transaction).
 *
 * Shared by every "a receipt arrived by email" path — the Resend inbound webhook
 * and the Gmail poller — so they always behave identically: store the file
 * privately, read it with AI, and file a matching transaction for review.
 *
 * Returns null when the attachment is a duplicate or can't be stored.
 */
export const ingestAttachment = async (
  admin: SupabaseClient,
  input: IngestAttachmentInput,
): Promise<{ receiptId: string; amount: number } | null> => {
  const { userId, filename, contentType, bytes, subject, sourceMessageId } = input;

  // Cheap pre-check; the unique index below is the real guard against races.
  if (sourceMessageId) {
    const { data: existing } = await admin
      .from("receipts")
      .select("id")
      .eq("user_id", userId)
      .eq("source_message_id", sourceMessageId)
      .maybeSingle();
    if (existing) return null;
  }

  const blob = await put(`receipts/${userId}/${filename}`, bytes, {
    access: "private",
    addRandomSuffix: true,
    contentType,
  });

  // Read it so the receipt lands with real values rather than a blank row.
  const analysis = await analyzeReceipt(bytes.toString("base64"), contentType);
  const usable = analysis?.is_receipt ? analysis : null;
  const amount = usable?.amount != null ? Math.abs(usable.amount) : 0;

  const { data: receipt, error } = await admin
    .from("receipts")
    .insert({
      user_id: userId,
      vendor: usable?.vendor ?? null,
      amount,
      receipt_date: usable?.date ?? undefined,
      category: usable?.category ?? null,
      source: "email",
      notes: subject,
      image_url: blob.url,
      image_pathname: blob.pathname,
      source_message_id: sourceMessageId ?? null,
    })
    .select("id")
    .single();

  // Unique-index violation = another run already ingested this attachment.
  if (error || !receipt) return null;

  // File it in the ledger, pending review. A refund is money coming back, so it
  // books as income; a $0 receipt moved no money and gets no transaction.
  if (amount > 0) {
    const vendor = usable?.vendor;
    await admin.from("transactions").insert({
      user_id: userId,
      txn_date: usable?.date ?? new Date().toISOString().slice(0, 10),
      description: vendor
        ? `${usable?.is_refund ? "Refund" : "Receipt"} — ${vendor}`
        : "Emailed receipt",
      amount,
      direction: usable?.is_refund ? "income" : "expense",
      status: "pending",
      category: usable?.category ?? null,
      receipt_id: receipt.id,
    });
  }

  return { receiptId: receipt.id, amount };
};
