"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { emptyToNull } from "@utils/doc-helpers";
import * as customers from "@services/supabase/customer";

export interface CustomerFormState {
  error?: string;
}

export const createCustomer = async (
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> => {
  const user = await getUserOrRedirect();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await customers.createCustomer(supabase, {
    user_id: user.id,
    name,
    email: emptyToNull(formData.get("email")),
    phone: emptyToNull(formData.get("phone")),
    address: emptyToNull(formData.get("address")),
  });
  if (error) return { error };

  revalidatePath("/customers");
  return {};
};

export const deleteCustomer = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await customers.deleteCustomer(supabase, id);
  revalidatePath("/customers");
};
