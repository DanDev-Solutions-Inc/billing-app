"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { emptyToNull } from "@utils/doc-helpers";
import { scanReceiptImage } from "@lib/receipts/scan";
import * as transactions from "@services/supabase/transaction";
import * as receipts from "@services/supabase/receipt";
import { TxnDirection } from "@typings/transaction/TxnDirection";
import { TxnStatus } from "@typings/transaction/TxnStatus";
import { TransactionFormState } from "@interfaces/forms/TransactionFormState";

const TXN_STATUSES: TxnStatus[] = ["pending", "approved"];

export const createTransactionAction = async (
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> => {
  const user = await getUserOrRedirect();
  const amount = Number(formData.get("amount")) || 0;
  let direction = String(formData.get("direction") ?? "") as TxnDirection;
  if (amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!["income", "expense"].includes(direction))
    return { error: "Choose income or expense." };

  const supabase = await createClient();

  const txnDate = emptyToNull(formData.get("txn_date"));
  const description = emptyToNull(formData.get("description"));
  let category = emptyToNull(formData.get("category"));
  /* Absent means the form never offered the choice, which isn't the same as the
     user un-ticking it — fall back to the default rather than reading absence
     as "no HST". */
  const taxIncluded = formData.has("tax_included")
    ? formData.get("tax_included") === "1"
    : true;

  // Optional attached image → store it as a receipt, scan it to fill any blank
  // fields, and link the transaction back to it.
  const imageUrl = emptyToNull(formData.get("image_url"));
  const imagePathname = emptyToNull(formData.get("image_pathname"));
  let receiptId: string | null = null;
  if (imageUrl) {
    const analysis = await scanReceiptImage(imageUrl);
    const receipt = await receipts.createReceipt(supabase, {
      user_id: user.id,
      vendor: description ?? analysis?.vendor ?? null,
      amount,
      receipt_date: txnDate ?? analysis?.date ?? undefined,
      category: category ?? analysis?.category ?? null,
      image_url: imageUrl,
      image_pathname: imagePathname,
      source: "upload",
      tax_included: taxIncluded,
    });
    receiptId = receipt.id ?? null;
    if (analysis?.is_receipt) {
      if (!category) category = analysis.category;
      // A scanned refund/return is money coming back — flip it to income.
      if (analysis.is_refund) direction = "income";
    }
  }

  await transactions.createTransaction(supabase, {
    user_id: user.id,
    amount,
    direction,
    // Manually entered transactions are already reviewed.
    status: "approved",
    txn_date: txnDate ?? undefined,
    description,
    category,
    tax_included: taxIncluded,
    receipt_id: receiptId,
  });

  revalidatePath("/transactions");
  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  redirect("/transactions?toast=transaction-saved");
};

export const updateTransactionAction = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const amount = Number(formData.get("amount")) || 0;
  const direction = String(formData.get("direction") ?? "") as TxnDirection;
  const supabase = await createClient();
  await transactions.updateTransaction(supabase, id, {
    amount: amount > 0 ? amount : undefined,
    direction: ["income", "expense"].includes(direction) ? direction : undefined,
    txn_date: emptyToNull(formData.get("txn_date")) ?? undefined,
    description: emptyToNull(formData.get("description")),
    category: emptyToNull(formData.get("category")),
    tax_included: formData.get("tax_included") === "1",
  });
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
  revalidatePath("/dashboard");
  redirect(`/transactions/${id}?toast=transaction-updated`);
};

export const setTransactionStatusAction = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as TxnStatus;
  if (!id || !TXN_STATUSES.includes(status)) return;
  const supabase = await createClient();
  await transactions.setTransactionStatus(supabase, id, status);
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
  redirect(
    `/transactions/${id}?toast=${status === "approved" ? "transaction-approved" : "transaction-reopened"}`,
  );
};

// Deleting a transaction also removes the receipt it was filed from (and its
// stored file) — the receipt only exists as that transaction's source document,
// so keeping it would leave an orphan the ledger no longer references.
export const deleteTransactionAction = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  // One Postgres function removes both rows in a single transaction and hands
  // back the receipt's file path; the Blob is deleted only once that commits.
  const { imagePathname } = await transactions.deleteTransactionCascade(
    supabase,
    id,
  );
  if (imagePathname) {
    try {
      await del(imagePathname);
    } catch {
      // Blob already gone or token missing — the rows are what matter.
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  redirect("/transactions?toast=transaction-deleted");
};

/* --- Bulk operations ----------------------------------------------------- */

/**
 * Mark every selected transaction reviewed (or reopen them).
 *
 * `status` is a *bound* argument, not a form field. It used to ride on the
 * submitting button as name/value, which silently never arrived: React nulls
 * the submitter when that same button carries a function `formAction`, so the
 * synthetic name/value input is never added to the FormData. The guard below
 * then saw an empty status and returned before writing — no error, no toast,
 * and the row stayed pending. Keep the value off the button.
 */
export const bulkSetStatusAction = async (
  status: TxnStatus,
  formData: FormData,
) => {
  await getUserOrRedirect();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (!ids.length || !TXN_STATUSES.includes(status)) return;

  const supabase = await createClient();
  await transactions.setTransactionStatusMany(supabase, ids, status);
  revalidatePath("/transactions");
  // Every sibling action revalidates this too — dashboard figures read status.
  revalidatePath("/dashboard");
  redirect(
    `/transactions?toast=${status === "approved" ? "transactions-approved" : "transactions-reopened"}`,
  );
};

/**
 * Apply a description and/or category to every selected transaction.
 * Blank fields are left untouched rather than blanked — a bulk edit shouldn't
 * wipe data you didn't intend to change.
 */
export const bulkEditAction = async (formData: FormData) => {
  await getUserOrRedirect();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (!ids.length) return;

  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  const values: { description?: string; category?: string } = {};
  if (description) values.description = description;
  if (category) values.category = category;
  if (!Object.keys(values).length) return;

  const supabase = await createClient();
  await transactions.updateTransactionMany(supabase, ids, values);
  revalidatePath("/transactions");
  redirect("/transactions?toast=transactions-updated");
};
