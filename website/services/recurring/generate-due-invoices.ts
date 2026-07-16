import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { Customer } from "@typings/customer/Customer";
import {
  listDueRecurring,
  advanceRecurring,
} from "@services/supabase/recurring-invoice";
import { createInvoice } from "@services/supabase/invoice";
import {
  createLineItems,
  listLineItems,
} from "@services/supabase/line-item";
import { computeTotals, formatMoney } from "@utils/money";
import { computeNextRun, addDays } from "@utils/cadence";
import { renderDocumentPdf } from "@lib/pdf/render";
import { sendDocumentEmail } from "@lib/email";

/**
 * Generate invoices for every recurring schedule due on/before `today`.
 * Runs from the cron with the admin client (no user session) — each invoice is
 * created under the schedule's own user_id.
 */
export const generateDueInvoices = async (
  admin: SupabaseClient,
  today: string,
): Promise<{ generated: number; sent: number }> => {
  const due = await listDueRecurring(admin, today);
  let generated = 0;
  let sent = 0;

  for (const schedule of due) {
    const items = (schedule.line_items as unknown as LineItemFormValues[]) ?? [];
    const nextRun = computeNextRun(
      today,
      schedule.frequency,
      schedule.interval,
    );
    const stillActive = !(schedule.end_date && nextRun > schedule.end_date);

    if (items.length > 0) {
      const totals = computeTotals(items, Number(schedule.tax_rate));
      const { id: invoiceId } = await createInvoice(admin, {
        user_id: schedule.user_id,
        customer_id: schedule.customer_id,
        notes: schedule.notes,
        issue_date: today,
        due_date: addDays(today, schedule.net_days),
        status: "draft",
        ...totals,
      });

      if (invoiceId) {
        await createLineItems(admin, {
          userId: schedule.user_id,
          parentType: "invoice",
          parentId: invoiceId,
          items,
        });
        generated += 1;

        if (schedule.auto_send && schedule.customer_id) {
          const emailed = await emailInvoice(
            admin,
            schedule.customer_id,
            invoiceId,
            totals.total,
          );
          if (emailed) {
            await admin
              .from("invoices")
              .update({ status: "sent" })
              .eq("id", invoiceId);
            sent += 1;
          }
        }
      }
    }

    await advanceRecurring(admin, schedule.id, {
      last_run: today,
      next_run: nextRun,
      active: stillActive,
    });
  }

  return { generated, sent };
};

const emailInvoice = async (
  admin: SupabaseClient,
  customerId: string,
  invoiceId: string,
  total: number,
): Promise<boolean> => {
  const { data: customer } = await admin
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();
  const to = (customer as Customer | null)?.email;
  if (!to) return false;

  const items = await listLineItems(admin, "invoice", invoiceId);
  const number = invoiceId.slice(0, 8);
  const pdf = await renderDocumentPdf({
    kind: "INVOICE",
    number,
    issueDate: new Date().toISOString().slice(0, 10),
    secondLabel: "Payment Due",
    secondDate: null,
    amountDue: total,
    customer: customer as Customer | null,
    items,
    subtotal: items.reduce((s, i) => s + Number(i.amount), 0),
    tax: 0,
    total,
    notes: null,
  });

  const result = await sendDocumentEmail({
    to,
    kind: "invoice",
    number,
    total: formatMoney(total),
    filename: `Invoice_${number}.pdf`,
    pdf,
  });
  return !result.error;
};
