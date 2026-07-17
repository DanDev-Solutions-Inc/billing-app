import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { TxnDirection } from "@typings/transaction/TxnDirection";
import { TxnStatus } from "@typings/transaction/TxnStatus";
import { TransactionInsert } from "@typings/transaction/TransactionInsert";
import { TransactionWithLinks } from "@interfaces/models/transaction/TransactionWithLinks";
import { TransactionDetail } from "@interfaces/models/transaction/TransactionDetail";
import { fetchAllRows } from "@services/supabase/fetch-all";

const WITH_LINKS = "*, receipts(vendor), invoices(invoice_number)";
const DETAIL =
  "*, receipts(id, vendor, image_url, receipt_date, amount, category), invoices(id, invoice_number, total)";

export const listTransactions = async (
  sb: SupabaseClient,
  direction?: TxnDirection,
  search?: string,
): Promise<TransactionWithLinks[]> => {
  // Commas/parens would break PostgREST's or() syntax.
  const q = search?.trim().replace(/[,()]/g, " ");

  /* Built per page: a PostgrestFilterBuilder can only be awaited once, so each
     range needs its own. Paged because a bare select() stops at PostgREST's
     1,000-row cap *without erroring* — that silently hid 3,693 of 4,693
     transactions and skewed every all-time total on the dashboard. */
  return fetchAllRows<TransactionWithLinks>((from, to) => {
    let query = sb
      .from("transactions")
      .select(WITH_LINKS)
      .order("txn_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (direction) query = query.eq("direction", direction);
    if (q) query = query.or(`description.ilike.%${q}%,category.ilike.%${q}%`);
    return query;
  });
};

/**
 * Descriptions already in use, most-used first — suggestions when entering a
 * new transaction, so the same vendor doesn't end up spelled three ways.
 *
 * Distinct-ing in the app rather than SQL: PostgREST can't express DISTINCT, and
 * a dedicated view would need maintaining for a list this small.
 */
export const listDescriptions = async (
  sb: SupabaseClient,
  limit = 200,
): Promise<string[]> => {
  const { data } = await sb
    .from("transactions")
    .select("description")
    .not("description", "is", null)
    .order("created_at", { ascending: false })
    .limit(2000);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const d = row.description?.trim();
    if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([d]) => d);
};

export const getTransaction = async (
  sb: SupabaseClient,
  id: string,
): Promise<TransactionDetail | null> => {
  const { data } = await sb
    .from("transactions")
    .select(DETAIL)
    .eq("id", id)
    .maybeSingle();
  return (data as TransactionDetail | null) ?? null;
};

export const createTransaction = async (
  sb: SupabaseClient,
  values: TransactionInsert,
): Promise<void> => {
  await sb.from("transactions").insert(values);
};

/** Insert a transaction and return its new id (for linking a receipt). */
export const createTransactionReturningId = async (
  sb: SupabaseClient,
  values: TransactionInsert,
): Promise<string | null> => {
  const { data } = await sb
    .from("transactions")
    .insert(values)
    .select("id")
    .single();
  return data?.id ?? null;
};

export const setTransactionStatus = async (
  sb: SupabaseClient,
  id: string,
  status: TxnStatus,
): Promise<void> => {
  await sb.from("transactions").update({ status }).eq("id", id);
};

/* Bulk variants use a single `.in("id", ids)` statement rather than N round
   trips, so approving 50 rows is one query. RLS still scopes them to the user. */
export const setTransactionStatusMany = async (
  sb: SupabaseClient,
  ids: string[],
  status: TxnStatus,
): Promise<void> => {
  if (!ids.length) return;
  await sb.from("transactions").update({ status }).in("id", ids);
};

export const updateTransactionMany = async (
  sb: SupabaseClient,
  ids: string[],
  values: Partial<TransactionInsert>,
): Promise<void> => {
  if (!ids.length || !Object.keys(values).length) return;
  await sb.from("transactions").update(values).in("id", ids);
};

export const updateTransaction = async (
  sb: SupabaseClient,
  id: string,
  values: Partial<TransactionInsert>,
): Promise<void> => {
  await sb.from("transactions").update(values).eq("id", id);
};

export const deleteTransaction = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  await sb.from("transactions").delete().eq("id", id);
};

/**
 * Delete a transaction and the receipt it was filed from, atomically.
 *
 * Both rows go or neither does — as two separate calls, a failure in between
 * would strand an orphaned receipt. Returns the receipt's Blob pathname (or
 * null) so the caller can delete the file only after the DB has committed;
 * storage can't take part in the transaction.
 */
export const deleteTransactionCascade = async (
  sb: SupabaseClient,
  id: string,
): Promise<{ imagePathname: string | null; error?: string }> => {
  const { data, error } = await sb.rpc("delete_transaction_cascade", {
    txn_id: id,
  });
  return { imagePathname: data ?? null, error: error?.message };
};

/** True when an income transaction already exists for the given invoice. */
export const hasInvoiceIncome = async (
  sb: SupabaseClient,
  invoiceId: string,
): Promise<boolean> => {
  const { data } = await sb
    .from("transactions")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("direction", "income")
    .maybeSingle();
  return Boolean(data);
};
