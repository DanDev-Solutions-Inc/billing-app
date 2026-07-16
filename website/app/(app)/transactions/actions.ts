"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { emptyToNull } from "@utils/doc-helpers";
import * as transactions from "@services/supabase/transaction";
import { TxnDirection } from "@typings/transaction/TxnDirection";

export interface TransactionFormState {
  error?: string;
}

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
  await transactions.createTransaction(supabase, {
    user_id: user.id,
    amount,
    direction,
    txn_date: emptyToNull(formData.get("txn_date")) ?? undefined,
    description: emptyToNull(formData.get("description")),
    category: emptyToNull(formData.get("category")),
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/transactions");
};

export const deleteTransactionAction = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await transactions.deleteTransaction(supabase, id);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
};
