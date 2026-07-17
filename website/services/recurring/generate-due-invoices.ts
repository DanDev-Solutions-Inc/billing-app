import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { EmailInvoiceInput } from "@interfaces/services/EmailInvoiceInput";
import {
  listDueRecurring,
  advanceRecurring,
} from "@services/supabase/recurring-invoice";
import {
  createInvoice,
  getNextInvoiceNumber,
  updateInvoiceStatus,
} from "@services/supabase/invoice";
import { getCustomer } from "@services/supabase/customer";
import {
  createLineItems,
  listLineItems,
} from "@services/supabase/line-item";
import { recordDocumentEmail } from "@services/supabase/document-email";
import { computeTotals, formatMoney } from "@utils/money";
import { chargesTax } from "@utils/currency";
import { customerEmails } from "@utils/customer-emails";
import { usdToCadOn } from "@services/fx/boc-rate";
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
      /* Currency decides the rate, same as the manual forms — a USD schedule
         must not start emitting taxed CAD invoices. */
      const taxRate = chargesTax(schedule.currency)
        ? Number(schedule.tax_rate)
        : 0;
      const totals = computeTotals(items, taxRate);
      /* The cron raises these unattended, so it stamps the day's official rate
         itself — a yearly USD invoice would otherwise carry whatever constant
         was current when the code was written. */
      const exchangeRate =
        schedule.currency === "USD" ? await usdToCadOn(today) : 1;
      const invoiceNumber = await getNextInvoiceNumber(admin, schedule.user_id);
      const dueDate = addDays(today, schedule.net_days);
      const { id: invoiceId } = await createInvoice(admin, {
        user_id: schedule.user_id,
        customer_id: schedule.customer_id,
        invoice_number: invoiceNumber,
        notes: schedule.notes,
        issue_date: today,
        due_date: dueDate,
        status: "draft",
        currency: schedule.currency,
        exchange_rate: exchangeRate,
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
          const emailed = await emailInvoice(admin, {
            userId: schedule.user_id,
            customerId: schedule.customer_id,
            invoiceId,
            invoiceNumber,
            issueDate: today,
            dueDate,
            currency: schedule.currency,
            totals,
            notes: schedule.notes,
            sendTo: schedule.send_to,
          });
          if (emailed) {
            /* Via the service, so marking sent behaves the same as it does
               anywhere else rather than being a bare column write. */
            await updateInvoiceStatus(admin, invoiceId, "sent");
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

/**
 * Email the invoice a schedule just generated.
 *
 * Takes the stored values rather than re-deriving them: this previously
 * hardcoded `tax: 0`, recomputed the subtotal from line items, and used
 * `invoiceId.slice(0, 8)` as the number — so a CAD customer received a PDF with
 * no HST row, a total that disagreed with the invoice record, and a reference
 * number matching nothing in the app.
 */
const emailInvoice = async (
  admin: SupabaseClient,
  input: EmailInvoiceInput,
): Promise<boolean> => {
  const customer = await getCustomer(admin, input.customerId);

  // The schedule's chosen address wins, but only while it's still one of the
  // customer's — an address removed from the customer shouldn't keep receiving
  // invoices. Otherwise follow the primary, so it tracks any later change.
  const known = customerEmails(customer);
  const to =
    input.sendTo && known.includes(input.sendTo) ? input.sendTo : known[0];
  if (!to) return false;

  const items = await listLineItems(admin, "invoice", input.invoiceId);
  const pdf = await renderDocumentPdf({
    kind: "INVOICE",
    currency: input.currency,
    number: input.invoiceNumber,
    issueDate: input.issueDate,
    secondLabel: "Payment Due",
    secondDate: input.dueDate,
    amountDue: input.totals.total,
    customer,
    items,
    ...input.totals,
    notes: input.notes,
  });

  const number = input.invoiceNumber ?? input.invoiceId.slice(0, 8);
  const result = await sendDocumentEmail({
    to,
    kind: "invoice",
    number,
    total: formatMoney(input.totals.total, input.currency),
    filename: `Invoice_${number}.pdf`,
    pdf,
  });
  if (result.error) return false;

  /* Record the send so Resend's delivery webhook has a row to stamp. This is
     where it matters most: nobody watches an unattended 8am cron send, so a
     bounced auto-invoice would otherwise go unnoticed until someone chased the
     payment. */
  if (result.emailId) {
    await recordDocumentEmail(admin, {
      userId: input.userId,
      parentType: "invoice",
      parentId: input.invoiceId,
      resendEmailId: result.emailId,
      recipient: to,
    });
  }
  return true;
};
