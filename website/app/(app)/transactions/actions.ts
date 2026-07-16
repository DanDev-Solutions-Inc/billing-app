"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { emptyToNull } from "@utils/doc-helpers";
import { scanReceiptImage } from "@lib/receipts/scan";
import * as transactions from "@services/supabase/transaction";
import * as receipts from "@services/supabase/receipt";
import { TxnDirection } from "@typings/transaction/TxnDirection";
import { TxnStatus } from "@typings/transaction/TxnStatus";

export interface TransactionFormState {
  error?: string;
}

const TXN_STATUSES: TxnStatus[] = ["pending", "approved"];

export const createTransactionAction = async (
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> => {
  const user = await getUserOrRedirect();
  const amount = Number(formData.get("amount")) || 0;
  const direction = String(formData.get("direction") ?? "") as TxnDirection;
  if (amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!["income", "expense"].includes(direction))
    return { error: "Choose income or expense." };

  const supabase = await createClient();

  const txnDate = emptyToNull(formData.get("txn_date"));
  const description = emptyToNull(formData.get("description"));
  let category = emptyToNull(formData.get("category"));

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
    });
    receiptId = receipt.id ?? null;
    if (!category && analysis?.is_receipt) category = analysis.category;
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
    receipt_id: receiptId,
  });

  revalidatePath("/transactions");
  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  redirect("/transactions");
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
  });
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
  revalidatePath("/dashboard");
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
};

export const deleteTransactionAction = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await transactions.deleteTransaction(supabase, id);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/transactions");
};
