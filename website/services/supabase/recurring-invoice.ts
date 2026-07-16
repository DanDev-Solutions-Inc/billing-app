import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { RecurringInvoice } from "@typings/recurring-invoice/RecurringInvoice";
import { RecurringInvoiceInsert } from "@typings/recurring-invoice/RecurringInvoiceInsert";
import { RecurringInvoiceWithCustomer } from "@interfaces/models/recurring-invoice/RecurringInvoiceWithCustomer";

export const listRecurring = async (
  sb: SupabaseClient,
): Promise<RecurringInvoiceWithCustomer[]> => {
  const { data } = await sb
    .from("recurring_invoices")
    .select("*, customers(*)")
    .order("next_run");
  return (data ?? []) as RecurringInvoiceWithCustomer[];
};

export const createRecurring = async (
  sb: SupabaseClient,
  values: RecurringInvoiceInsert,
): Promise<{ error?: string }> => {
  const { error } = await sb.from("recurring_invoices").insert(values);
  return { error: error?.message };
};

export const setRecurringActive = async (
  sb: SupabaseClient,
  id: string,
  active: boolean,
): Promise<void> => {
  await sb.from("recurring_invoices").update({ active }).eq("id", id);
};

export const deleteRecurring = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  await sb.from("recurring_invoices").delete().eq("id", id);
};

/** Schedules due to run on/before `today` (cron; uses the admin client). */
export const listDueRecurring = async (
  admin: SupabaseClient,
  today: string,
): Promise<RecurringInvoice[]> => {
  const { data } = await admin
    .from("recurring_invoices")
    .select("*")
    .eq("active", true)
    .lte("next_run", today);
  return data ?? [];
};

export const advanceRecurring = async (
  admin: SupabaseClient,
  id: string,
  patch: { last_run: string; next_run: string; active?: boolean },
): Promise<void> => {
  await admin.from("recurring_invoices").update(patch).eq("id", id);
};
