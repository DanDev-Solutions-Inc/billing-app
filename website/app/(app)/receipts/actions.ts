"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { emptyToNull } from "@utils/doc-helpers";
import { scanReceiptImage } from "@lib/receipts/scan";
import { deleteReceiptWithFile } from "@services/receipts/delete-receipt";
import * as receipts from "@services/supabase/receipt";
import * as transactions from "@services/supabase/transaction";
import { UploadedReceipt } from "@interfaces/forms/UploadedReceipt";

const today = () => new Date().toISOString().slice(0, 10);

export interface ReceiptFormState {
  error?: string;
}

export interface BulkReceiptState {
  error?: string;
  count?: number;
}

export const createReceiptsFromUploads = async (
  uploads: UploadedReceipt[],
): Promise<BulkReceiptState> => {
  const user = await getUserOrRedirect();
  const supabase = await createClient();
  const { count, error } = await receipts.createReceipts(
    supabase,
    uploads.map((u) => ({
      user_id: user.id,
      source: "upload" as const,
      vendor: null,
      amount: 0,
      image_url: u.url,
      image_pathname: u.pathname,
      notes: u.filename,
    })),
  );
  if (error) return { error };
  revalidatePath("/receipts");
  return { count };
};

export const createReceipt = async (
  formData: FormData,
): Promise<ReceiptFormState> => {
  const user = await getUserOrRedirect();
  const supabase = await createClient();

  const imageUrl = emptyToNull(formData.get("image_url"));
  const formAmount = Number(formData.get("amount")) || 0;
  const formVendor = emptyToNull(formData.get("vendor"));
  const formCategory = emptyToNull(formData.get("category"));
  const formDate = emptyToNull(formData.get("receipt_date"));

  const { id, error } = await receipts.createReceipt(supabase, {
    user_id: user.id,
    vendor: formVendor,
    amount: formAmount,
    receipt_date: formDate ?? undefined,
    category: formCategory,
    notes: emptyToNull(formData.get("notes")),
    image_url: imageUrl,
    image_pathname: emptyToNull(formData.get("image_pathname")),
    source: "upload",
  });
  if (error || !id) return { error: error ?? "Failed to save receipt." };

  // AI: read the image and fill in whatever the user left blank.
  let vendor = formVendor;
  let amount = formAmount;
  let category = formCategory;
  let date = formDate;
  // A refund/return is money coming back — record it as income, not an expense.
  let isRefund = false;
  if (imageUrl) {
    const analysis = await scanReceiptImage(imageUrl);
    if (analysis?.is_receipt) {
      vendor = vendor ?? analysis.vendor;
      category = category ?? analysis.category;
      date = date ?? analysis.date;
      isRefund = analysis.is_refund;
      if (amount <= 0 && analysis.amount && analysis.amount !== 0)
        amount = Math.abs(analysis.amount);
      await receipts.updateReceipt(supabase, id, {
        vendor,
        amount,
        category,
        receipt_date: date ?? undefined,
      });
    }
  }

  // Record the receipt as a categorised transaction (linked to it).
  if (formData.get("as_expense") && amount > 0) {
    await transactions.createTransaction(supabase, {
      user_id: user.id,
      txn_date: date ?? today(),
      description: vendor
        ? `${isRefund ? "Refund" : "Receipt"} — ${vendor}`
        : isRefund
          ? "Refund"
          : "Receipt expense",
      amount,
      direction: isRefund ? "income" : "expense",
      status: "pending",
      category,
      receipt_id: id,
    });
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
  }

  revalidatePath("/receipts");
  redirect(`/receipts/${id}?toast=receipt-saved`);
};

export const updateReceiptAction = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await receipts.updateReceipt(supabase, id, {
    vendor: emptyToNull(formData.get("vendor")),
    amount: Number(formData.get("amount")) || 0,
    receipt_date: emptyToNull(formData.get("receipt_date")) ?? undefined,
    category: emptyToNull(formData.get("category")),
    notes: emptyToNull(formData.get("notes")),
  });

  // The linked transaction is a separate record — correcting a receipt doesn't
  // rewrite the ledger. Change the amount there if it was wrong too.
  revalidatePath("/receipts");
  revalidatePath(`/receipts/${id}`);
  redirect(`/receipts/${id}?toast=receipt-saved`);
};

export const deleteReceipt = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  await deleteReceiptWithFile(supabase, id);

  revalidatePath("/receipts");
  revalidatePath("/transactions");
  redirect("/receipts?toast=receipt-deleted");
};
