import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { Customer } from "@typings/customer/Customer";
import { CustomerInsert } from "@typings/customer/CustomerInsert";
import { CustomerBillingSummary } from "@typings/customer/CustomerBillingSummary";

export const listCustomers = async (
  sb: SupabaseClient,
  search?: string,
): Promise<Customer[]> => {
  let query = sb.from("customers").select("*").order("name");
  // Searching in Postgres, not the page: it covers every customer, not just the
  // ones already rendered. Commas would break PostgREST's or() syntax.
  const q = search?.trim().replace(/[,()]/g, " ");
  if (q)
    query = query.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`,
    );
  const { data } = await query;
  return data ?? [];
};

export const getCustomer = async (
  sb: SupabaseClient,
  id: string,
): Promise<Customer | null> => {
  const { data } = await sb
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
};

/** Invoice count + billed totals per customer, keyed by customer id. */
export const getBillingSummaries = async (
  sb: SupabaseClient,
): Promise<Map<string, CustomerBillingSummary>> => {
  const { data } = await sb.from("customer_billing_summary").select("*");
  return new Map((data ?? []).map((r) => [r.customer_id, r]));
};

export const createCustomer = async (
  sb: SupabaseClient,
  values: CustomerInsert,
): Promise<{ error?: string }> => {
  const { error } = await sb.from("customers").insert(values);
  return { error: error?.message };
};

export const updateCustomer = async (
  sb: SupabaseClient,
  id: string,
  values: Partial<CustomerInsert>,
): Promise<{ error?: string }> => {
  const { error } = await sb.from("customers").update(values).eq("id", id);
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
