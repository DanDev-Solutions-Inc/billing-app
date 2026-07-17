import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { RecurringInvoice } from "@typings/recurring-invoice/RecurringInvoice";
import { RecurringInvoiceInsert } from "@typings/recurring-invoice/RecurringInvoiceInsert";
import { RecurringInvoiceWithCustomer } from "@interfaces/models/recurring-invoice/RecurringInvoiceWithCustomer";

export const listRecurring = async (
  sb: SupabaseClient,
): Promise<RecurringInvoiceWithCustomer[]> => {
  /* Soonest next_run first — a schedule list answers "what bills next?", and
     newest-created put a 2027 renewal above one due next week. Paused rows
     have a stale next_run, so they sink below the live ones.
     created_at is the tiebreak for schedules sharing a date. */
  const { data } = await sb
    .from("recurring_invoices")
    .select("*, customers(*)")
    .order("active", { ascending: false })
    .order("next_run", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []) as RecurringInvoiceWithCustomer[];
};

export const createRecurring = async (
  sb: SupabaseClient,
  values: RecurringInvoiceInsert,
): Promise<{ error?: string }> => {
  const { error } = await sb.from("recurring_invoices").insert(values);
  return { error: error?.message };
};

export const getRecurring = async (
  sb: SupabaseClient,
  id: string,
): Promise<RecurringInvoiceWithCustomer | null> => {
  const { data } = await sb
    .from("recurring_invoices")
    .select("*, customers(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as RecurringInvoiceWithCustomer) ?? null;
};

export const updateRecurring = async (
  sb: SupabaseClient,
  id: string,
  values: Partial<RecurringInvoiceInsert>,
): Promise<{ error?: string }> => {
  const { error } = await sb
    .from("recurring_invoices")
    .update(values)
    .eq("id", id);
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
