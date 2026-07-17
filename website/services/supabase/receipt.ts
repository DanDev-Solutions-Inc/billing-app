import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { Receipt } from "@typings/receipt/Receipt";
import { ReceiptInsert } from "@typings/receipt/ReceiptInsert";
import { ReceiptFilters } from "@interfaces/services/ReceiptFilters";
import { RECEIPT_PAGE_SIZE } from "@utils/table";
import { Filterable } from "@interfaces/services/Filterable";

/**
 * Apply the shared filters. List and count both go through here on purpose: when
 * the two drifted, a tab badge would promise 40 receipts and the grid would show
 * a different set.
 *
 * Not `async` — returning the builder from an async fn would await it, firing
 * the query before the caller adds its own range/order.
 */
const narrow = <T extends Filterable<T>>(query: T, filters: ReceiptFilters): T => {
  let q = query;
  if (filters.source) q = q.eq("source", filters.source);
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.from) q = q.gte("receipt_date", filters.from);
  // Commas and parens are the or() grammar's own separators — a vendor like
  // "Bell (Mobility), Inc" would otherwise be parsed as extra conditions.
  const text = filters.search?.trim().replace(/[,()]/g, " ");
  if (text)
    q = q.or(
      `vendor.ilike.%${text}%,category.ilike.%${text}%,notes.ilike.%${text}%`,
    );
  return q;
};

/**
 * A page of receipts, filtered and sorted by Postgres.
 *
 * Paged for a sharper reason than the other lists: each card renders an <img>
 * pointing at an authenticated route that does an auth check, a DB read and a
 * blob fetch *per image*. Rendering the lot meant ~3,598 of those from one page
 * view. A grid page is larger than a table's, hence the bigger default.
 */
export const listReceipts = async (
  sb: SupabaseClient,
  filters: ReceiptFilters = {},
): Promise<{ rows: Receipt[]; total: number }> => {
  const page = Math.max(1, filters.page ?? 1);
  const size = filters.pageSize ?? RECEIPT_PAGE_SIZE;
  const from = (page - 1) * size;

  const query = sb
    .from("receipts")
    .select("*", { count: "exact" })
    .order("receipt_date", { ascending: false })
    // Stable tiebreak so rows can't shuffle between pages.
    .order("created_at", { ascending: false })
    .range(from, from + size - 1);

  const { data, count } = await narrow(query, filters);
  return { rows: data ?? [], total: count ?? 0 };
};

/** How many receipts match, without fetching them — for the tab badges. */
export const countReceipts = async (
  sb: SupabaseClient,
  filters: ReceiptFilters = {},
): Promise<number> => {
  const query = sb.from("receipts").select("id", { count: "exact", head: true });
  const { count } = await narrow(query, filters);
  return count ?? 0;
};

export const getReceipt = async (
  sb: SupabaseClient,
  id: string,
): Promise<Receipt | null> => {
  const { data } = await sb
    .from("receipts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
};

export const createReceipt = async (
  sb: SupabaseClient,
  values: ReceiptInsert,
): Promise<{ id?: string; error?: string }> => {
  const { data, error } = await sb
    .from("receipts")
    .insert(values)
    .select("id")
    .single();
  return { id: data?.id, error: error?.message };
};

export const updateReceipt = async (
  sb: SupabaseClient,
  id: string,
  values: Partial<ReceiptInsert>,
): Promise<void> => {
  await sb.from("receipts").update(values).eq("id", id);
};

export const deleteReceipt = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  await sb.from("receipts").delete().eq("id", id);
};

/** Bulk-insert receipts (used by the multi-image import). */
export const createReceipts = async (
  sb: SupabaseClient,
  values: ReceiptInsert[],
): Promise<{ count: number; error?: string }> => {
  if (values.length === 0) return { count: 0 };
  const { data, error } = await sb.from("receipts").insert(values).select("id");
  return { count: data?.length ?? 0, error: error?.message };
};
