import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { Customer } from "@typings/customer/Customer";
import { CustomerInsert } from "@typings/customer/CustomerInsert";

export const listCustomers = async (
  sb: SupabaseClient,
): Promise<Customer[]> => {
  const { data } = await sb.from("customers").select("*").order("name");
  return data ?? [];
};

export const createCustomer = async (
  sb: SupabaseClient,
  values: CustomerInsert,
): Promise<{ error?: string }> => {
  const { error } = await sb.from("customers").insert(values);
  return { error: error?.message };
};

export const deleteCustomer = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  await sb.from("customers").delete().eq("id", id);
};

/**
 * Insert or update a customer keyed by (user_id, wave_id). Uses an explicit
 * select-then-update/insert rather than ON CONFLICT — supabase-js can't target
 * the partial unique index (…where wave_id is not null) for conflict inference.
 */
export const upsertCustomerByWaveId = async (
  sb: SupabaseClient,
  values: CustomerInsert,
): Promise<{ id?: string; error?: string }> => {
  const { data: existing } = await sb
    .from("customers")
    .select("id")
    .eq("user_id", values.user_id)
    .eq("wave_id", values.wave_id ?? "")
    .maybeSingle();
  if (existing) {
    const { error } = await sb
      .from("customers")
      .update(values)
      .eq("id", existing.id);
    return { id: existing.id, error: error?.message };
  }
  const { data, error } = await sb
    .from("customers")
    .insert(values)
    .select("id")
    .single();
  return { id: data?.id, error: error?.message };
};
