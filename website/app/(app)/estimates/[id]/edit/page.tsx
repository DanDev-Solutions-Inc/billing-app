import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getEstimate } from "@services/supabase/estimate";
import { listLineItems } from "@services/supabase/line-item";
import { listCustomers } from "@services/supabase/customer";
import { PageHeader } from "@components/ui";
import { DocForm } from "@components/doc-form";
import { updateEstimate } from "../../actions";

export const metadata: Metadata = { title: "Edit estimate" };

const EditEstimatePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  await getUserOrRedirect();
  const supabase = await createClient();

  const est = await getEstimate(supabase, id);
  if (!est) notFound();

  const [items, customers] = await Promise.all([
    listLineItems(supabase, "estimate", id),
    listCustomers(supabase),
  ]);

  return (
    <>
      <PageHeader
        title={`Edit estimate ${est.estimate_number ?? ""}`.trim()}
        subtitle="Update the customer, dates, line items, or notes."
      />
      <DocForm
        kind="estimate"
        customers={customers}
        action={updateEstimate.bind(null, id)}
        submitLabel="Save changes"
        defaults={{
          customerId: est.customer_id,
          number: est.estimate_number,
          issueDate: est.issue_date ?? undefined,
          secondDate: est.expiry_date,
          notes: est.notes,
          /* Derive the rate back from the stored totals so the form opens on
             the rate this estimate was actually priced at. */
          taxRate: est.subtotal
            ? Math.round((est.tax / est.subtotal) * 10000) / 100
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

export default EditEstimatePage;
