"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { renderDocumentPdf } from "@lib/pdf/render";
import { sendDocumentEmail } from "@lib/email";
import { parseLineItems, emptyToNull } from "@utils/doc-helpers";
import { computeTotals, formatMoney } from "@utils/money";
import { chargesTax } from "@utils/currency";
import { parseCurrency } from "@utils/doc-helpers";
import * as invoices from "@services/supabase/invoice";
import * as lineItems from "@services/supabase/line-item";
import * as transactions from "@services/supabase/transaction";
import { InvoiceStatus } from "@typings/invoice/InvoiceStatus";
import { DocFormState } from "@components/doc-form";

export interface SendState {
  error?: string;
  ok?: string;
}

const INVOICE_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid"];

export const createInvoice = async (
  _prev: DocFormState,
  formData: FormData,
): Promise<DocFormState> => {
  const user = await getUserOrRedirect();
  const items = parseLineItems(formData);
  if (items.length === 0) return { error: "Add at least one line item." };

  /* The tax rate is derived from the currency here, not taken from the form:
     a USD document is never taxed, and that rule can't live only in the UI. */
  const currency = parseCurrency(formData.get("currency"));
  const taxRate = chargesTax(currency)
    ? Number(formData.get("tax_rate")) || 0
    : 0;
  const totals = computeTotals(items, taxRate);
  const supabase = await createClient();

  const { id, error } = await invoices.createInvoice(supabase, {
    user_id: user.id,
    customer_id: emptyToNull(formData.get("customer_id")),
    invoice_number: await invoices.getNextInvoiceNumber(supabase, user.id),
    issue_date: emptyToNull(formData.get("issue_date")) ?? undefined,
    due_date: emptyToNull(formData.get("second_date")),
    notes: emptyToNull(formData.get("notes")),
    currency,
    ...totals,
  });
  if (error || !id) return { error: error ?? "Failed to save." };

  const { error: liError } = await lineItems.createLineItems(supabase, {
    userId: user.id,
    parentType: "invoice",
    parentId: id,
    items,
  });
  if (liError) return { error: liError };

  revalidatePath("/invoices");
  redirect(`/invoices/${id}?toast=invoice-created`);
};

export const updateInvoice = async (
  id: string,
  _prev: DocFormState,
  formData: FormData,
): Promise<DocFormState> => {
  const user = await getUserOrRedirect();
  const items = parseLineItems(formData);
  if (items.length === 0) return { error: "Add at least one line item." };

  /* The tax rate is derived from the currency here, not taken from the form:
     a USD document is never taxed, and that rule can't live only in the UI. */
  const currency = parseCurrency(formData.get("currency"));
  const taxRate = chargesTax(currency)
    ? Number(formData.get("tax_rate")) || 0
    : 0;
  const totals = computeTotals(items, taxRate);
  const supabase = await createClient();

  const { error } = await invoices.updateInvoice(supabase, id, {
    customer_id: emptyToNull(formData.get("customer_id")),
    issue_date: emptyToNull(formData.get("issue_date")) ?? undefined,
    due_date: emptyToNull(formData.get("second_date")),
    notes: emptyToNull(formData.get("notes")),
    currency,
    ...totals,
  });
  if (error) return { error };

  // Replace the line items wholesale (polymorphic table, no cascade).
  await lineItems.deleteLineItems(supabase, "invoice", id);
  const { error: liError } = await lineItems.createLineItems(supabase, {
    userId: user.id,
    parentType: "invoice",
    parentId: id,
    items,
  });
  if (liError) return { error: liError };

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}?toast=invoice-saved`);
};

export const setInvoiceStatus = async (formData: FormData) => {
  const user = await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as InvoiceStatus;
  if (!id || !INVOICE_STATUSES.includes(status)) return;

  const supabase = await createClient();
  const invoice = await invoices.updateInvoiceStatus(supabase, id, status);

  // Marking paid records an income transaction (once).
  if (status === "paid" && invoice) {
    const alreadyRecorded = await transactions.hasInvoiceIncome(supabase, id);
    if (!alreadyRecorded) {
      await transactions.createTransaction(supabase, {
        user_id: user.id,
        txn_date: invoice.issue_date,
        description: `Invoice ${invoice.invoice_number ?? id.slice(0, 8)} paid`,
        amount: invoice.total,
        direction: "income",
        category: "Sales",
        invoice_id: id,
      });
    }
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
};

export const sendInvoice = async (
  _prev: SendState,
  formData: FormData,
): Promise<SendState> => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const invoice = await invoices.getInvoice(supabase, id);
  if (!invoice) return { error: "Invoice not found." };

  /* Send to the address that was picked, but only if it's still one of the
     customer's — a value posted from a stale form shouldn't email a stranger.
     Otherwise fall back to the primary. */
  const chosen = String(formData.get("to") ?? "").trim();
  const known = [
    invoice.customers?.email,
    ...(invoice.customers?.secondary_emails ?? []),
  ].filter(Boolean) as string[];
  const to = chosen && known.includes(chosen) ? chosen : invoice.customers?.email;
  if (!to)
    return { error: "This customer has no email address. Add one first." };

  const items = await lineItems.listLineItems(supabase, "invoice", id);
  const pdf = await renderDocumentPdf({
    kind: "INVOICE",
    number: invoice.invoice_number,
    issueDate: invoice.issue_date,
    secondLabel: "Payment Due",
    secondDate: invoice.due_date,
    amountDue: invoice.status === "paid" ? 0 : invoice.total,
    customer: invoice.customers,
    items,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    notes: invoice.notes,
  });

  const number = invoice.invoice_number ?? id.slice(0, 8);
  const result = await sendDocumentEmail({
    to,
    kind: "invoice",
    number,
    total: formatMoney(invoice.total, invoice.currency),
    filename: `Invoice_${number}.pdf`,
    pdf,
  });
  if (result.error) return { error: result.error };

  /* Emailing it *is* sending it — flag it, unless it's already paid (that would
     be a downgrade). */
  if (invoice.status !== "paid" && invoice.status !== "sent") {
    await invoices.updateInvoiceStatus(supabase, id, "sent");
  }
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return { ok: `Sent to ${to}.` };
};

export const deleteInvoice = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  // Polymorphic line items have no cascade FK — remove them first.
  await lineItems.deleteLineItems(supabase, "invoice", id);
  await invoices.deleteInvoice(supabase, id);
  revalidatePath("/invoices");
  redirect("/invoices?toast=invoice-deleted");
};
