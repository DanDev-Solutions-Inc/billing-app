import "server-only";
import { del } from "@vercel/blob";
import * as receipts from "@services/supabase/receipt";
import { SupabaseClient } from "@typings/SupabaseClient";

/**
 * Delete a receipt and its stored file.
 *
 * Shared by the receipt page and the transaction delete, so the Blob object is
 * never left behind paying rent for a row that no longer exists.
 */
export const deleteReceiptWithFile = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  const receipt = await receipts.getReceipt(sb, id);
  if (receipt?.image_pathname) {
    try {
      await del(receipt.image_pathname);
    } catch {
      // Blob already gone or token missing — proceed with the row delete.
    }
  }
  await receipts.deleteReceipt(sb, id);
};
