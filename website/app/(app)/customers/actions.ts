"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { emptyToNull } from "@utils/doc-helpers";
import * as customers from "@services/supabase/customer";
import { CustomerFormState } from "@interfaces/forms/CustomerFormState";

/** Address parts + extra contacts, shared by create and update. */
const detailsFrom = (formData: FormData) => ({
  email: emptyToNull(formData.get("email")),
  phone: emptyToNull(formData.get("phone")),
  address_line1: emptyToNull(formData.get("address_line1")),
  address_line2: emptyToNull(formData.get("address_line2")),
  city: emptyToNull(formData.get("city")),
  province: emptyToNull(formData.get("province")),
  postal_code: emptyToNull(formData.get("postal_code")),
  country: emptyToNull(formData.get("country")),
  // Repeated field — one entry per extra contact, blanks dropped.
  secondary_emails: formData
    .getAll("secondary_email")
    .map((v) => String(v).trim())
    .filter(Boolean),
});

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
    ...detailsFrom(formData),
  });
  if (error) return { error };

  revalidatePath("/customers");
  return {};
};

export const updateCustomerAction = async (
  id: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> => {
  await getUserOrRedirect();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await customers.updateCustomer(supabase, id, {
    name,
    ...detailsFrom(formData),
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
