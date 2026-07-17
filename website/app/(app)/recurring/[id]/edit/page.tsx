import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getRecurring } from "@services/supabase/recurring-invoice";
import { listCustomers } from "@services/supabase/customer";
import { PageHeader } from "@components/ui";
import { RecurringInvoiceForm } from "@components/recurring-invoice-form";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { updateRecurringInvoice } from "../../actions";

export const metadata: Metadata = { title: "Edit recurring invoice" };

const EditRecurringPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  await getUserOrRedirect();
  const supabase = await createClient();

  const schedule = await getRecurring(supabase, id);
  if (!schedule) notFound();

  const customers = await listCustomers(supabase);
  const items = (schedule.line_items as unknown as LineItemFormValues[]) ?? [];

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
    </>
  );
};

export default EditRecurringPage;
