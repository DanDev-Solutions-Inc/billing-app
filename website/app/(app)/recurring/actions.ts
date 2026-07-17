"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { parseLineItems, emptyToNull } from "@utils/doc-helpers";
import * as recurring from "@services/supabase/recurring-invoice";
import { RecurringFrequency } from "@typings/recurring-invoice/RecurringFrequency";
import { Json } from "@typings/Supabase";

export interface RecurringFormState {
  error?: string;
}

const FREQUENCIES: RecurringFrequency[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

export const createRecurringInvoice = async (
  _prev: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> => {
  const user = await getUserOrRedirect();
  const items = parseLineItems(formData);
  if (items.length === 0) return { error: "Add at least one line item." };

  const frequency = String(formData.get("frequency") ?? "") as RecurringFrequency;
  if (!FREQUENCIES.includes(frequency))
    return { error: "Choose a valid frequency." };

  const nextRun = emptyToNull(formData.get("next_run"));
  if (!nextRun) return { error: "Choose a start date." };

  const supabase = await createClient();
  const { error } = await recurring.createRecurring(supabase, {
    user_id: user.id,
    customer_id: emptyToNull(formData.get("customer_id")),
    title: emptyToNull(formData.get("title")),
    line_items: items as unknown as Json,
    tax_rate: Number(formData.get("tax_rate")) || 0,
    notes: emptyToNull(formData.get("notes")),
    frequency,
    interval: Math.max(1, Number(formData.get("interval")) || 1),
    next_run: nextRun,
    net_days: Math.max(0, Number(formData.get("net_days")) || 14),
    auto_send: formData.get("auto_send") === "on",
    // "" (primary) is stored as null so the schedule follows the customer.
    send_to: emptyToNull(formData.get("send_to")),
    end_date: emptyToNull(formData.get("end_date")),
  });
  if (error) return { error };

  revalidatePath("/recurring");
  redirect("/recurring?toast=recurring-created");
};

/* The schedule's shape, shared by create and update. `next_run` is deliberately
   editable: it's when the next invoice goes out, and moving it is the whole
   point of editing a live schedule. */
const scheduleFrom = (formData: FormData) => ({
  customer_id: emptyToNull(formData.get("customer_id")),
  title: emptyToNull(formData.get("title")),
  tax_rate: Number(formData.get("tax_rate")) || 0,
  notes: emptyToNull(formData.get("notes")),
  interval: Math.max(1, Number(formData.get("interval")) || 1),
  net_days: Math.max(0, Number(formData.get("net_days")) || 14),
  auto_send: formData.get("auto_send") === "on",
  // "" (primary) is stored as null so the schedule follows the customer.
  send_to: emptyToNull(formData.get("send_to")),
  end_date: emptyToNull(formData.get("end_date")),
});

export const updateRecurringInvoice = async (
  id: string,
  _prev: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> => {
  await getUserOrRedirect();
  const items = parseLineItems(formData);
  if (items.length === 0) return { error: "Add at least one line item." };

  const frequency = String(formData.get("frequency") ?? "") as RecurringFrequency;
  if (!FREQUENCIES.includes(frequency))
    return { error: "Choose a valid frequency." };

  const nextRun = emptyToNull(formData.get("next_run"));
  if (!nextRun) return { error: "Choose a start date." };

  const supabase = await createClient();
  const { error } = await recurring.updateRecurring(supabase, id, {
    ...scheduleFrom(formData),
    line_items: items as unknown as Json,
    frequency,
    next_run: nextRun,
  });
  if (error) return { error };

  revalidatePath("/recurring");
  redirect("/recurring?toast=recurring-saved");
};

export const toggleRecurring = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  const supabase = await createClient();
  await recurring.setRecurringActive(supabase, id, active);
  revalidatePath("/recurring");
};

export const deleteRecurringAction = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await recurring.deleteRecurring(supabase, id);
  revalidatePath("/recurring");
};
