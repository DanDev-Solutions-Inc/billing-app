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
import { usdToCadOn } from "@services/fx/boc-rate";
import { parseCurrency } from "@utils/doc-helpers";
import * as estimates from "@services/supabase/estimate";
import * as invoices from "@services/supabase/invoice";
import * as lineItems from "@services/supabase/line-item";
import { EstimateStatus } from "@typings/estimate/EstimateStatus";
import { DocFormState } from "@components/doc-form";

export interface SendState {
  error?: string;
  ok?: string;
}

const ESTIMATE_STATUSES: EstimateStatus[] = [
  "draft",
  "sent",
  "accepted",
  "declined",
];

export const createEstimate = async (
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
  /* Stamp the day's official rate so the document reports in CAD at what it was
     actually worth. CAD is 1 — the identity — so no call is made for it. */
  const issueDate =
    emptyToNull(formData.get("issue_date")) ??
    new Date().toISOString().slice(0, 10);
  const exchangeRate =
    currency === "USD" ? await usdToCadOn(issueDate) : 1;
  const supabase = await createClient();

  const { id, error } = await estimates.createEstimate(supabase, {
    user_id: user.id,
    customer_id: emptyToNull(formData.get("customer_id")),
    estimate_number: emptyToNull(formData.get("number")),
    issue_date: emptyToNull(formData.get("issue_date")) ?? undefined,
    expiry_date: emptyToNull(formData.get("second_date")),
    notes: emptyToNull(formData.get("notes")),
    currency,
    exchange_rate: exchangeRate,
    ...totals,
  });
  if (error || !id) return { error: error ?? "Failed to save." };

  const { error: liError } = await lineItems.createLineItems(supabase, {
    userId: user.id,
    parentType: "estimate",
    parentId: id,
    items,
  });
  if (liError) return { error: liError };

  revalidatePath("/estimates");
  redirect(`/estimates/${id}`);
};

export const updateEstimate = async (
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
  /* Stamp the day's official rate so the document reports in CAD at what it was
     actually worth. CAD is 1 — the identity — so no call is made for it. */
  const issueDate =
    emptyToNull(formData.get("issue_date")) ??
    new Date().toISOString().slice(0, 10);
  const exchangeRate =
    currency === "USD" ? await usdToCadOn(issueDate) : 1;
  const supabase = await createClient();

  const { error } = await estimates.updateEstimate(supabase, id, {
    customer_id: emptyToNull(formData.get("customer_id")),
    estimate_number: emptyToNull(formData.get("number")),
    issue_date: emptyToNull(formData.get("issue_date")) ?? undefined,
    expiry_date: emptyToNull(formData.get("second_date")),
    notes: emptyToNull(formData.get("notes")),
    currency,
    exchange_rate: exchangeRate,
    ...totals,
  });
  if (error) return { error };

  // Replace the line items wholesale (polymorphic table, no cascade).
  await lineItems.deleteLineItems(supabase, "estimate", id);
  const { error: liError } = await lineItems.createLineItems(supabase, {
    userId: user.id,
    parentType: "estimate",
    parentId: id,
    items,
  });
  if (liError) return { error: liError };

  revalidatePath("/estimates");
  revalidatePath(`/estimates/${id}`);
  redirect(`/estimates/${id}?toast=estimate-saved`);
};

export const setEstimateStatus = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as EstimateStatus;
  if (!id || !ESTIMATE_STATUSES.includes(status)) return;

  const supabase = await createClient();
  await estimates.updateEstimateStatus(supabase, id, status);
  revalidatePath("/estimates");
  revalidatePath(`/estimates/${id}`);
};

export const convertToInvoice = async (formData: FormData) => {
  const user = await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const estimate = await estimates.getEstimate(supabase, id);
  if (!estimate) return;
  // Guard: only accepted estimates convert, and only once.
  if (estimate.status !== "accepted" || estimate.converted_invoice_id) {
    revalidatePath(`/estimates/${id}`);
    return;
  }

  const { id: invoiceId } = await invoices.createInvoice(supabase, {
    user_id: user.id,
    customer_id: estimate.customer_id,
    invoice_number: await invoices.getNextInvoiceNumber(supabase, user.id),
    notes: estimate.notes,
    // Carry the estimate's currency across: a USD quote must not become a CAD
    // invoice (its totals were priced without tax).
    currency: estimate.currency,
    // Carry the estimate's own rate: the invoice is that quote, honoured — not
    // a fresh conversion at today's rate.
    exchange_rate: estimate.exchange_rate,
    subtotal: estimate.subtotal,
    tax: estimate.tax,
    total: estimate.total,
    status: "draft",
  });
  if (!invoiceId) return;

  const items = await lineItems.listLineItems(supabase, "estimate", id);
  if (items.length) {
    await lineItems.createLineItems(supabase, {
      userId: user.id,
      parentType: "invoice",
      parentId: invoiceId,
      items,
    });
  }

  await estimates.setEstimateConverted(supabase, id, invoiceId);

  revalidatePath("/estimates");
  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId}`);
};

export const sendEstimate = async (
  _prev: SendState,
  formData: FormData,
): Promise<SendState> => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const estimate = await estimates.getEstimate(supabase, id);
  if (!estimate) return { error: "Estimate not found." };

  /* Send to the address that was picked, but only if it's still one of the
     customer's — a value posted from a stale form shouldn't email a stranger.
     Otherwise fall back to the primary. */
  const chosen = String(formData.get("to") ?? "").trim();
  const known = [
    estimate.customers?.email,
    ...(estimate.customers?.secondary_emails ?? []),
  ].filter(Boolean) as string[];
  const to =
    chosen && known.includes(chosen) ? chosen : estimate.customers?.email;
  if (!to)
    return { error: "This customer has no email address. Add one first." };

  const items = await lineItems.listLineItems(supabase, "estimate", id);
  const pdf = await renderDocumentPdf({
    kind: "ESTIMATE",
    currency: estimate.currency,
    number: estimate.estimate_number,
    issueDate: estimate.issue_date,
    secondLabel: "Expires",
    secondDate: estimate.expiry_date,
    amountDue: estimate.total,
    customer: estimate.customers,
    items,
    subtotal: estimate.subtotal,
    tax: estimate.tax,
    total: estimate.total,
    notes: estimate.notes,
  });

  const number = estimate.estimate_number ?? id.slice(0, 8);
  const result = await sendDocumentEmail({
    to,
    kind: "estimate",
    number,
    total: formatMoney(estimate.total, estimate.currency),
    filename: `Estimate_${number}.pdf`,
    pdf,
  });
  if (result.error) return { error: result.error };

  if (estimate.status === "draft") {
    await estimates.updateEstimateStatus(supabase, id, "sent");
  }
  revalidatePath("/estimates");
  revalidatePath(`/estimates/${id}`);
  return { ok: `Sent to ${to}.` };
};

export const deleteEstimate = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await lineItems.deleteLineItems(supabase, "estimate", id);
  await estimates.deleteEstimate(supabase, id);
  revalidatePath("/estimates");
  redirect("/estimates");
};
