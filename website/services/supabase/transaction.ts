import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { TxnStatus } from "@typings/transaction/TxnStatus";
import { TransactionInsert } from "@typings/transaction/TransactionInsert";
import { TransactionWithLinks } from "@interfaces/models/transaction/TransactionWithLinks";
import { TransactionDetail } from "@interfaces/models/transaction/TransactionDetail";
import { PAGE_SIZE } from "@utils/table";
import { TransactionFilters } from "@interfaces/services/TransactionFilters";
import { Filterable } from "@interfaces/services/Filterable";

const WITH_LINKS = "*, receipts(vendor), invoices(invoice_number)";
const DETAIL =
  "*, receipts(id, vendor, image_url, receipt_date, amount, category), invoices(id, invoice_number, total)";

/**
 * Apply the shared filters. list and count both go through here on purpose:
 * when the two drifted, a tab badge would advertise a count the grid can't
 * produce. Mirrors receipt.ts's narrow().
 *
 * Not async — returning the builder from an async fn would await it, firing the
 * query before the caller adds its own range/order.
 */
const narrow = <T extends Filterable<T>>(
  query: T,
  filters: TransactionFilters,
): T => {
  let q = query;
  if (filters.direction) q = q.eq("direction", filters.direction);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.from) q = q.gte("txn_date", filters.from);
  // Commas/parens are the or() grammar's own separators — strip them so a
  // description can't inject extra conditions.
  const text = filters.search?.trim().replace(/[,()]/g, " ");
  if (text) q = q.or(`description.ilike.%${text}%,category.ilike.%${text}%`);
  return q;
};

/**
 * A page of transactions, filtered and sorted by Postgres.
 *
 * Everything the list narrows by is a stored column, so none of it belongs in
 * JS: fetching 4,693 rows to render 10 wasted the transfer, the parse, and two
 * array copies on every request — and a bare select() silently stopped at
 * PostgREST's 1,000-row cap, hiding 3,693 of them.
 *
 * Returns the total alongside the rows, because the pager needs the count of
 * what matched, not of what was returned.
 */
export const listTransactions = async (
  sb: SupabaseClient,
  filters: TransactionFilters = {},
): Promise<{ rows: TransactionWithLinks[]; total: number }> => {
  const page = Math.max(1, filters.page ?? 1);
  const size = filters.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * size;

  const query = sb
    .from("transactions")
    .select(WITH_LINKS, { count: "exact" })
    .order(filters.sort ?? "txn_date", { ascending: filters.dir === "asc" })
    // Stable tiebreak: without it, rows sharing a date can shuffle between
    // pages and appear twice (or not at all).
    .order("created_at", { ascending: false })
    .range(from, from + size - 1);

  const { data, count } = await narrow(query, filters);
  return { rows: (data ?? []) as TransactionWithLinks[], total: count ?? 0 };
};

/**
 * How many transactions match, without fetching any.
 *
 * `head: true` asks Postgres for the count and no rows — what the tab badges
 * need. Three of these is far cheaper than one full fetch.
 */
export const countTransactions = async (
  sb: SupabaseClient,
  filters: TransactionFilters = {},
): Promise<number> => {
  const query = sb
    .from("transactions")
    .select("id", { count: "exact", head: true });

  const { count } = await narrow(query, filters);
  return count ?? 0;
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
