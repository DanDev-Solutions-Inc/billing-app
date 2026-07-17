import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getInvoice } from "@services/supabase/invoice";
import { listLineItems } from "@services/supabase/line-item";
import { listCustomers } from "@services/supabase/customer";
import { PageHeader } from "@components/ui";
import { DocForm } from "@components/doc-form";
import { updateInvoice } from "../../actions";

export const metadata: Metadata = { title: "Edit invoice" };

const EditInvoicePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  await getUserOrRedirect();
  const supabase = await createClient();

  const inv = await getInvoice(supabase, id);
  if (!inv) notFound();

  const [items, customers] = await Promise.all([
    listLineItems(supabase, "invoice", id),
    listCustomers(supabase),
  ]);

  return (
    <>
      <PageHeader
        backHref={`/invoices/${id}`}
        title={`Edit invoice ${inv.invoice_number ?? ""}`.trim()}
        subtitle="Update the customer, dates, line items, or notes."
      />
      <DocForm
        kind="invoice"
        customers={customers}
        action={updateInvoice.bind(null, id)}
        submitLabel="Save changes"
        defaults={{
          customerId: inv.customer_id,
          number: inv.invoice_number,
          issueDate: inv.issue_date ?? undefined,
          secondDate: inv.due_date,
          notes: inv.notes,
          taxRate: inv.subtotal
            ? Math.round((inv.tax / inv.subtotal) * 10000) / 100
            : 13,
          items: items.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
          })),
        }}
      />
    </>
  );
};

export default EditInvoicePage;
