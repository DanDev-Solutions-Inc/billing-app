"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { renderDocumentPdf } from "@lib/pdf/render";
import { sendDocumentEmail } from "@lib/email";
import { parseLineItems, emptyToNull } from "@utils/doc-helpers";
import { computeTotals, formatMoney } from "@utils/money";
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

  const totals = computeTotals(items, Number(formData.get("tax_rate")) || 0);
  const supabase = await createClient();

  const { id, error } = await invoices.createInvoice(supabase, {
    user_id: user.id,
    customer_id: emptyToNull(formData.get("customer_id")),
    invoice_number: emptyToNull(formData.get("number")),
    issue_date: emptyToNull(formData.get("issue_date")) ?? undefined,
    due_date: emptyToNull(formData.get("second_date")),
    notes: emptyToNull(formData.get("notes")),
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
  redirect(`/invoices/${id}`);
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

  const to = invoice.customers?.email;
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
    total: formatMoney(invoice.total),
    filename: `Invoice_${number}.pdf`,
    pdf,
  });
  if (result.error) return { error: result.error };

  if (invoice.status === "draft") {
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
  redirect("/invoices");
};
