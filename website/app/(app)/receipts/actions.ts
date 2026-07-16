"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { emptyToNull } from "@utils/doc-helpers";
import * as receipts from "@services/supabase/receipt";
import * as transactions from "@services/supabase/transaction";
import { UploadedReceipt } from "@interfaces/forms/UploadedReceipt";

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

  const amount = Number(formData.get("amount")) || 0;
  const receiptDate = emptyToNull(formData.get("receipt_date"));
  const vendor = emptyToNull(formData.get("vendor"));

  const { id, error } = await receipts.createReceipt(supabase, {
    user_id: user.id,
    vendor,
    amount,
    receipt_date: receiptDate ?? undefined,
    category: emptyToNull(formData.get("category")),
    notes: emptyToNull(formData.get("notes")),
    image_url: emptyToNull(formData.get("image_url")),
    image_pathname: emptyToNull(formData.get("image_pathname")),
    source: "upload",
  });
  if (error || !id) return { error: error ?? "Failed to save receipt." };

  // Optionally record the receipt as an expense transaction.
  if (formData.get("as_expense") && amount > 0) {
    await transactions.createTransaction(supabase, {
      user_id: user.id,
      txn_date: receiptDate ?? new Date().toISOString().slice(0, 10),
      description: vendor ? `Receipt — ${vendor}` : "Receipt expense",
      amount,
      direction: "expense",
      category: emptyToNull(formData.get("category")),
      receipt_id: id,
    });
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
  }

  revalidatePath("/receipts");
  redirect(`/receipts/${id}`);
};

export const deleteReceipt = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const receipt = await receipts.getReceipt(supabase, id);
  if (receipt?.image_pathname) {
    try {
      await del(receipt.image_pathname);
    } catch {
      // Blob already gone or token missing — proceed with the row delete.
    }
  }
  await receipts.deleteReceipt(supabase, id);

  revalidatePath("/receipts");
  redirect("/receipts");
};
