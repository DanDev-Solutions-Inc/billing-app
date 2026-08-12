"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { renderDocumentPdf } from "@lib/pdf/render";
import { sendDocumentEmail } from "@lib/email";
import { formatMoney, round2 } from "@utils/money";
import { balanceOf, paidOf } from "@utils/invoice";
import { isPaymentMethod } from "@utils/payment-method";
import { PaymentMethod } from "@typings/invoice-payment/PaymentMethod";
import { parseDocumentForm } from "@services/documents/parse-document-form";
import * as invoices from "@services/supabase/invoice";
import * as lineItems from "@services/supabase/line-item";
import * as transactions from "@services/supabase/transaction";
import * as payments from "@services/supabase/invoice-payment";
import { recordDocumentEmail } from "@services/supabase/document-email";
import { InvoiceStatus } from "@typings/invoice/InvoiceStatus";
import { Invoice } from "@typings/invoice/Invoice";
import { SupabaseClient } from "@typings/SupabaseClient";
import { DocFormState } from "@interfaces/forms/DocFormState";
import { SendState } from "@interfaces/forms/SendState";
import { PaymentState } from "@interfaces/forms/PaymentState";

const INVOICE_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid"];

/** Every view that a payment moves. */
const revalidateForPayment = (id?: string) => {
  revalidatePath("/invoices");
  if (id) revalidatePath(`/invoices/${id}`);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/customers");
};

/**
 * When the money arrived, as the two things the ledger needs: the instant to
 * store, and the calendar date to file it under.
 *
 * Both come from the browser, because only it knows the user's timezone — this
 * runs in UTC, so deriving the date from the instant here would book a 9 p.m.
 * payment on the following day. Falls back to the server clock for callers that
 * don't send either (an unattended path, where "now" is all there is).
 */
const paymentMoment = (formData: FormData) => {
  const at = String(formData.get("paid_at") ?? "");
  const on = String(formData.get("paid_on") ?? "").slice(0, 10);
  const valid = at && !Number.isNaN(Date.parse(at));
  const paidAt = valid ? new Date(at).toISOString() : new Date().toISOString();
  return {
    paidAt,
    paidOn: /^\d{4}-\d{2}-\d{2}$/.test(on) ? on : paidAt.slice(0, 10),
  };
};

/**
 * Record money received and book the matching income, as one step.
 *
 * The invoice's amount_paid and status are the trigger's job, not ours — see
 * sync_invoice_payment_total. Shared by the payment modal and by the status
 * dropdown's "paid" shortcut, so both leave the same trail: settling an invoice
 * from the list is the same event as recording its final payment.
 */
const recordPayment = async (
  supabase: SupabaseClient,
  userId: string,
  invoice: Invoice,
  input: {
    amount: number;
    paidAt: string;
    paidOn: string;
    method?: PaymentMethod;
  },
): Promise<{ error?: string }> => {
  const { payment, error } = await payments.createInvoicePayment(supabase, {
    user_id: userId,
    invoice_id: invoice.id,
    amount: input.amount,
    paid_at: input.paidAt,
    method: input.method ?? null,
  });
  if (error || !payment) return { error: error ?? "Failed to record payment." };

  await transactions.createTransaction(supabase, {
    user_id: userId,
    txn_date: input.paidOn,
    description: `Invoice ${invoice.invoice_number ?? invoice.id.slice(0, 8)} payment`,
    amount: input.amount,
    direction: "income",
    category: "Sales",
    /* The invoice knows exactly what tax it charged, so trust that instead of
       imputing 13% back out of the payment. USD invoices are 0% (see
       taxRateFor), as is any invoice issued at a zero rate. A part payment
       carries its share of that tax, which is what tax_included means for a
       gross amount. */
    tax_included: Number(invoice.tax) > 0,
    invoice_id: invoice.id,
    payment_id: payment.id,
  });

  return {};
};

export const createInvoice = async (
  _prev: DocFormState,
  formData: FormData,
): Promise<DocFormState> => {
  const doc = await parseDocumentForm(formData);
  if (!doc) return { error: "Add at least one line item." };

  const { id, error } = await invoices.createInvoice(doc.supabase, {
    user_id: doc.user.id,
    customer_id: doc.customerId,
    invoice_number: await invoices.getNextInvoiceNumber(doc.supabase, doc.user.id),
    issue_date: doc.issueDate,
    due_date: doc.secondDate,
    notes: doc.notes,
    currency: doc.currency,
    exchange_rate: doc.exchangeRate,
    ...doc.totals,
  });
  if (error || !id) return { error: error ?? "Failed to save." };

  const { error: liError } = await lineItems.createLineItems(doc.supabase, {
    userId: doc.user.id,
    parentType: "invoice",
    parentId: id,
    items: doc.items,
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
  const doc = await parseDocumentForm(formData);
  if (!doc) return { error: "Add at least one line item." };

  const { error } = await invoices.updateInvoice(doc.supabase, id, {
    customer_id: doc.customerId,
    issue_date: doc.issueDate,
    due_date: doc.secondDate,
    notes: doc.notes,
    currency: doc.currency,
    exchange_rate: doc.exchangeRate,
    ...doc.totals,
  });
  if (error) return { error };

  // Replace the line items wholesale (polymorphic table, no cascade).
  await lineItems.deleteLineItems(doc.supabase, "invoice", id);
  const { error: liError } = await lineItems.createLineItems(doc.supabase, {
    userId: doc.user.id,
    parentType: "invoice",
    parentId: id,
    items: doc.items,
  });
  if (liError) return { error: liError };

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}?toast=invoice-saved`);
};

/**
 * Set the status from the list dropdown.
 *
 * "Paid" is no longer a flag to flip: it means the rest of the money came in,
 * so it records a payment for whatever is outstanding and lets the trigger move
 * the status. Going the other way is refused while payments exist — the rows
 * are what make an invoice paid, and silently deleting a customer's payment
 * history to relabel one would be the wrong kind of convenient. Delete the
 * payment on the invoice instead.
 */
export const setInvoiceStatus = async (formData: FormData) => {
  const user = await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as InvoiceStatus;
  if (!id || !INVOICE_STATUSES.includes(status)) return;

  const supabase = await createClient();
  const invoice = await invoices.getInvoice(supabase, id);
  if (!invoice) return;

  if (status === "paid") {
    const balance = balanceOf(invoice);
    if (balance > 0) {
      const { paidAt, paidOn } = paymentMoment(formData);
      await recordPayment(supabase, user.id, invoice, {
        amount: balance,
        paidAt,
        paidOn,
      });
    } else {
      // Nothing left to pay (a zero-dollar invoice): it's just the label.
      await invoices.updateInvoiceStatus(supabase, id, status);
    }
  } else if (paidOf(invoice) === 0) {
    await invoices.updateInvoiceStatus(supabase, id, status);
  }

  revalidateForPayment(id);
};

/**
 * Record a payment — the whole balance by default, or part of it.
 *
 * Rejects more than is outstanding rather than allowing a credit: an amount
 * over the balance is nearly always a typo, and an invoice that owes negative
 * money would misreport everywhere it's summed.
 */
export const recordInvoicePayment = async (
  formData: FormData,
): Promise<PaymentState> => {
  const user = await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const invoice = await invoices.getInvoice(supabase, id);
  if (!invoice) return { error: "Invoice not found." };

  const amount = round2(Number(formData.get("amount")));
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "Enter an amount greater than zero." };

  const balance = balanceOf(invoice);
  if (balance <= 0) return { error: "This invoice is already paid in full." };
  if (amount > balance)
    return {
      error: `That's more than the ${formatMoney(balance, invoice.currency)} outstanding.`,
    };

  const { paidAt, paidOn } = paymentMoment(formData);
  const method = String(formData.get("method") ?? "");
  const { error } = await recordPayment(supabase, user.id, invoice, {
    amount,
    paidAt,
    paidOn,
    // Anything not on the list is dropped rather than stored — the column's
    // check constraint would reject it anyway.
    method: isPaymentMethod(method) ? method : undefined,
  });
  if (error) return { error };

  revalidateForPayment(id);

  const left = round2(balance - amount);
  return {
    ok:
      left > 0
        ? `Recorded ${formatMoney(amount, invoice.currency)} — ${formatMoney(left, invoice.currency)} still outstanding.`
        : `Recorded ${formatMoney(amount, invoice.currency)}. This invoice is paid in full.`,
  };
};

/**
 * Remove a payment recorded by mistake. Its income transaction goes with it
 * (transactions.payment_id cascades), and the invoice drops back out of 'paid'
 * if this was the payment covering it.
 */
export const removeInvoicePayment = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { invoiceId } = await payments.deleteInvoicePayment(supabase, id);
  revalidateForPayment(invoiceId);
};

export const sendInvoice = async (
  _prev: SendState,
  formData: FormData,
): Promise<SendState> => {
  const user = await getUserOrRedirect();
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
    currency: invoice.currency,
    number: invoice.invoice_number,
    issueDate: invoice.issue_date,
    secondLabel: "Payment Due",
    secondDate: invoice.due_date,
    // The remainder, not the total — a reminder for a part-paid invoice should
    // ask for what's left.
    amountDue: balanceOf(invoice),
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

  /* Record the send so Resend's delivery webhook has a row to stamp when this
     is delivered, opened or bounced. */
  if (result.emailId) {
    await recordDocumentEmail(supabase, {
      userId: user.id,
      parentType: "invoice",
      parentId: id,
      resendEmailId: result.emailId,
      recipient: to,
    });
  }

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
