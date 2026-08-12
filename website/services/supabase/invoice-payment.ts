import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { InvoicePayment } from "@typings/invoice-payment/InvoicePayment";
import { InvoicePaymentInsert } from "@typings/invoice-payment/InvoicePaymentInsert";

/** Payments against one invoice, oldest first — the order they were received. */
export const listInvoicePayments = async (
  sb: SupabaseClient,
  invoiceId: string,
): Promise<InvoicePayment[]> => {
  const { data } = await sb
    .from("invoice_payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: true });
  return data ?? [];
};

/**
 * Record a payment. The invoice's amount_paid and status follow by trigger
 * (sync_invoice_payment_total), so nothing here has to touch the invoice row.
 */
export const createInvoicePayment = async (
  sb: SupabaseClient,
  values: InvoicePaymentInsert,
): Promise<{ payment?: InvoicePayment; error?: string }> => {
  const { data, error } = await sb
    .from("invoice_payments")
    .insert(values)
    .select("*")
    .single();
  return { payment: data ?? undefined, error: error?.message };
};

/**
 * Remove a payment. Its income transaction goes with it — transactions.payment_id
 * cascades — and the trigger drops the invoice back out of 'paid' if this was
 * what covered it.
 */
export const deleteInvoicePayment = async (
  sb: SupabaseClient,
  id: string,
): Promise<{ invoiceId?: string; error?: string }> => {
  /* The id is all the caller has, but the pages to revalidate are keyed by
     invoice — so read it back before the row is gone. */
  const { data } = await sb
    .from("invoice_payments")
    .select("invoice_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await sb.from("invoice_payments").delete().eq("id", id);
  return { invoiceId: data?.invoice_id, error: error?.message };
};
