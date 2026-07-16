"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { renderDocumentPdf } from "@lib/pdf/render";
import { sendDocumentEmail } from "@lib/email";
import { parseLineItems, emptyToNull } from "@utils/doc-helpers";
import { computeTotals, formatMoney } from "@utils/money";
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

  const totals = computeTotals(items, Number(formData.get("tax_rate")) || 0);
  const supabase = await createClient();

  const { id, error } = await estimates.createEstimate(supabase, {
    user_id: user.id,
    customer_id: emptyToNull(formData.get("customer_id")),
    estimate_number: emptyToNull(formData.get("number")),
    issue_date: emptyToNull(formData.get("issue_date")) ?? undefined,
    expiry_date: emptyToNull(formData.get("second_date")),
    notes: emptyToNull(formData.get("notes")),
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

  const to = estimate.customers?.email;
  if (!to)
    return { error: "This customer has no email address. Add one first." };

  const items = await lineItems.listLineItems(supabase, "estimate", id);
  const pdf = await renderDocumentPdf({
    kind: "ESTIMATE",
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
    total: formatMoney(estimate.total),
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
