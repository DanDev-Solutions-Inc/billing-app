import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { ReceiptCategoryCount } from "@interfaces/models/receipt/ReceiptCategoryCount";

/**
 * The categories receipts actually carry, most-used first.
 *
 * Read from the data rather than RECEIPT_CATEGORIES: the constant is the list
 * we offer when *creating* a receipt, but imported rows carry Wave's names, so
 * a filter built from the constant can only reach a fraction of the ledger.
 */
export const listReceiptCategories = async (
  sb: SupabaseClient,
): Promise<ReceiptCategoryCount[]> => {
  const { data } = await sb.rpc("receipt_categories");
  return (data ?? []).map((r) => ({ category: r.category, count: Number(r.count) }));
};
