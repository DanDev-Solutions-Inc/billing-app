import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getRecurring } from "@services/supabase/recurring-invoice";
import { listCustomers } from "@services/supabase/customer";
import { PageHeader } from "@components/ui";
import { RecurringInvoiceForm } from "@components/recurring-invoice-form";
import { ScheduleInvoices } from "@components/recurring/schedule-invoices";
import { listScheduleInvoices } from "@services/supabase/invoice";
import { scheduleTerm } from "@utils/cadence";
import { paymentStatus } from "@utils/invoice";
import { computeTotals } from "@utils/money";
import { sortRows, paginate, Accessors } from "@utils/table";
import { tableView } from "@utils/table/table-view";
import { Invoice } from "@typings/invoice/Invoice";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { updateRecurringInvoice } from "../../actions";

export const metadata: Metadata = { title: "Edit recurring invoice" };

/* Same column semantics as the invoices list: ISO dates sort lexically, money
   numerically. */
const ACCESSORS: Accessors<Invoice> = {
  invoice_number: (i) => Number(i.invoice_number) || 0,
  issue_date: (i) => i.issue_date,
  due_date: (i) => i.due_date,
  total: (i) => Number(i.total),
  amount_paid: (i) => Number(i.amount_paid),
  status: (i) => paymentStatus(i),
};
const SORT_KEYS = Object.keys(ACCESSORS);

const EditRecurringPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; dir?: string; page?: string }>;
}) => {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await getUserOrRedirect();
  const supabase = await createClient();

  const schedule = await getRecurring(supabase, id);
  if (!schedule) notFound();

  const [customers, raised] = await Promise.all([
    listCustomers(supabase),
    listScheduleInvoices(supabase, id),
  ]);
  /* Newest first — the invoice you'd be checking on is the latest one. The
     anchor keeps sort/page clicks on the table rather than the form above. */
  const view = tableView({
    basePath: `/recurring/${id}/edit`,
    params: query,
    sortKeys: SORT_KEYS,
    defaultSort: "issue_date",
  });
  const toTable = (href: string) => `${href}#schedule-invoices`;
  const result = paginate(
    sortRows(raised, view.sort, view.dir, ACCESSORS),
    view.page,
  );
  const items = (schedule.line_items as unknown as LineItemFormValues[]) ?? [];
  const term = scheduleTerm(
    schedule,
    computeTotals(items, Number(schedule.tax_rate)).total,
    raised,
  );

  return (
    <>
      <PageHeader
        title="Edit recurring invoice"
        subtitle={
          schedule.title ||
          schedule.customers?.name ||
          "Update the cadence, line items, or delivery."
        }
      />
      <RecurringInvoiceForm
        customers={customers}
        action={updateRecurringInvoice.bind(null, id)}
        submitLabel="Save changes"
        defaults={{
          currency: schedule.currency,
          customer_id: schedule.customer_id ?? "",
          title: schedule.title ?? "",
          frequency: schedule.frequency,
          interval: schedule.interval,
          next_run: schedule.next_run,
          net_days: schedule.net_days,
          auto_send: schedule.auto_send,
          // null = follow the customer's primary address.
          send_to: schedule.send_to ?? "",
          end_date: schedule.end_date ?? "",
          notes: schedule.notes ?? "",
          tax_rate: Number(schedule.tax_rate),
          items: items.length
            ? items
            : [{ description: "", quantity: 1, unit_price: 0 }],
        }}
      />
      <div id="schedule-invoices" className="mt-6 scroll-mt-6">
        <ScheduleInvoices
          invoices={raised}
          result={result}
          sort={view.sort}
          dir={view.dir}
          sortHref={(key) => toTable(view.sortHref(key))}
          pageHref={(p) => toTable(view.pageHref(p))}
          currency={schedule.currency}
          plannedCount={term?.count ?? null}
        />
      </div>
    </>
  );
};

export default EditRecurringPage;
