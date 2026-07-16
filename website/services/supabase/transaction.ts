import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { TxnDirection } from "@typings/transaction/TxnDirection";
import { TransactionInsert } from "@typings/transaction/TransactionInsert";
import { TransactionWithLinks } from "@interfaces/models/transaction/TransactionWithLinks";

const WITH_LINKS = "*, receipts(vendor), invoices(invoice_number)";

export const listTransactions = async (
  sb: SupabaseClient,
  direction?: TxnDirection,
): Promise<TransactionWithLinks[]> => {
  let query = sb
    .from("transactions")
    .select(WITH_LINKS)
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (direction) query = query.eq("direction", direction);
  const { data } = await query;
  return (data ?? []) as TransactionWithLinks[];
};

export const createTransaction = async (
  sb: SupabaseClient,
  values: TransactionInsert,
): Promise<void> => {
  await sb.from("transactions").insert(values);
};

export const deleteTransaction = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  await sb.from("transactions").delete().eq("id", id);
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
