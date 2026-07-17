import { createClient } from "@lib/supabase/server";
import { getUser } from "@lib/dal";
import { renderDocumentPdf } from "@lib/pdf/render";
import { getRecurring } from "@services/supabase/recurring-invoice";
import { computeTotals } from "@utils/money";
import { chargesTax } from "@utils/currency";
import { addDays } from "@utils/cadence";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { LineItem } from "@typings/line-item/LineItem";

export const runtime = "nodejs";

/**
 * Preview the next invoice a schedule will generate.
 *
 * Nothing is written: the numbers are computed exactly as the cron would, so
 * what's previewed is what the customer will receive. The invoice number is
 * shown as "next in sequence" rather than a real one — allocating one here
 * would burn it on a preview.
 */
export const GET = async (
  _req: Request,
  ctx: RouteContext<"/recurring/[id]/pdf">,
) => {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const supabase = await createClient();
  const schedule = await getRecurring(supabase, id);
  if (!schedule) return new Response("Not found", { status: 404 });

  const rows = (schedule.line_items as unknown as LineItemFormValues[]) ?? [];
  // Same rule as the generator: a USD schedule is never taxed.
  const taxRate = chargesTax(schedule.currency) ? Number(schedule.tax_rate) : 0;
  const totals = computeTotals(rows, taxRate);

  /* The PDF renders stored line items; these are the schedule's template, so
     they're shaped to match rather than being written to the table first. */
  const items = rows.map((it, i) => ({
    id: `preview-${i}`,
    user_id: schedule.user_id,
    parent_type: "invoice" as const,
    parent_id: id,
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unit_price,
    amount: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    position: i,
    created_at: new Date().toISOString(),
  })) satisfies LineItem[];

  const pdf = await renderDocumentPdf({
    kind: "INVOICE",
    currency: schedule.currency,
    number: "PREVIEW",
    issueDate: schedule.next_run,
    secondLabel: "Payment Due",
    secondDate: addDays(schedule.next_run, schedule.net_days),
    amountDue: totals.total,
    customer: schedule.customers,
    items,
    ...totals,
    notes: schedule.notes,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Preview_${schedule.title || "recurring"}.pdf"`,
    },
  });
};
