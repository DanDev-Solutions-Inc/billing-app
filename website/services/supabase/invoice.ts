import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { Invoice } from "@typings/invoice/Invoice";
import { InvoiceStatus } from "@typings/invoice/InvoiceStatus";
import { InvoiceInsert } from "@typings/invoice/InvoiceInsert";
import { InvoiceWithCustomer } from "@interfaces/models/invoice/InvoiceWithCustomer";

const WITH_CUSTOMER = "*, customers(*)";

export const listInvoices = async (
  sb: SupabaseClient,
): Promise<InvoiceWithCustomer[]> => {
  const { data } = await sb
    .from("invoices")
    .select(WITH_CUSTOMER)
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as InvoiceWithCustomer[];
};

export const getInvoice = async (
  sb: SupabaseClient,
  id: string,
): Promise<InvoiceWithCustomer | null> => {
  const { data } = await sb
    .from("invoices")
    .select(WITH_CUSTOMER)
    .eq("id", id)
    .maybeSingle();
  return (data as InvoiceWithCustomer) ?? null;
};

export const createInvoice = async (
  sb: SupabaseClient,
  values: InvoiceInsert,
): Promise<{ id?: string; error?: string }> => {
  const { data, error } = await sb
    .from("invoices")
    .insert(values)
    .select("id")
    .single();
  return { id: data?.id, error: error?.message };
};

export const updateInvoiceStatus = async (
  sb: SupabaseClient,
  id: string,
  status: InvoiceStatus,
): Promise<Invoice | null> => {
  const { data } = await sb
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  return data ?? null;
};

export const deleteInvoice = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  await sb.from("invoices").delete().eq("id", id);
};

/** Insert or update an invoice keyed by (user_id, wave_id). Returns the row id. */
export const upsertInvoiceByWaveId = async (
  sb: SupabaseClient,
  values: InvoiceInsert,
): Promise<{ id?: string; error?: string }> => {
  const { data: existing } = await sb
    .from("invoices")
    .select("id")
    .eq("user_id", values.user_id)
    .eq("wave_id", values.wave_id ?? "")
    .maybeSingle();
  if (existing) {
    const { error } = await sb
      .from("invoices")
      .update(values)
      .eq("id", existing.id);
    return { id: existing.id, error: error?.message };
  }
  const { data, error } = await sb
    .from("invoices")
    .insert(values)
    .select("id")
    .single();
  return { id: data?.id, error: error?.message };
};
