import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { Receipt } from "@typings/receipt/Receipt";
import { ReceiptInsert } from "@typings/receipt/ReceiptInsert";
import { fetchAllRows } from "@services/supabase/fetch-all";

export const listReceipts = async (
  sb: SupabaseClient,
): Promise<Receipt[]> =>
  /* Paged past PostgREST's 1,000-row cap, which silently hid 2,598 of 3,598
     receipts — a bare select() returns the first page without erroring. */
  fetchAllRows<Receipt>((from, to) =>
    sb
      .from("receipts")
      .select("*")
      .order("receipt_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to),
  );

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
