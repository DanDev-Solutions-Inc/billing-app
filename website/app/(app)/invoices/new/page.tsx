import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listCustomers } from "@services/supabase/customer";
import { getInvoice } from "@services/supabase/invoice";
import { listLineItems } from "@services/supabase/line-item";
import { PageHeader } from "@components/ui";
import { DocForm } from "@components/doc-form";
import { DocFormProps } from "@interfaces/components/DocFormProps";
import { SupabaseClient } from "@typings/SupabaseClient";
import { daysBetween } from "@utils/date";
import { taxRateFor, toCurrency } from "@utils/currency";
import { createInvoice } from "../actions";

export const metadata: Metadata = { title: "New invoice" };

/**
 * Prefill from an existing invoice (?from=<id>, the "Duplicate" action).
 *
 * Copies what's billed and to whom — customer, currency, tax, line items,
 * notes — but not what belongs to the original: its number, status and
 * payments. The issue date is left to the form (today, in the browser's
 * timezone) and the due date keeps the original's terms relative to it.
 */
const duplicateDefaults = async (
  supabase: SupabaseClient,
  id: string,
): Promise<DocFormProps["defaults"] | undefined> => {
  const inv = await getInvoice(supabase, id);
  if (!inv) return undefined;
  const items = await listLineItems(supabase, "invoice", id);
  const currency = toCurrency(inv.currency);

  return {
    customerId: inv.customer_id,
    currency,
    notes: inv.notes,
    taxRate: inv.subtotal
      ? Math.round((inv.tax / inv.subtotal) * 10000) / 100
      : taxRateFor(currency),
    termDays:
      inv.issue_date && inv.due_date
        ? daysBetween(inv.issue_date, inv.due_date)
        : undefined,
    items: items.map((it) => ({
      description: it.description,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
    })),
  };
};

const NewInvoicePage = async ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) => {
  await getUserOrRedirect();
  const { from } = await searchParams;
  const supabase = await createClient();
  const [customers, defaults] = await Promise.all([
    listCustomers(supabase),
    from ? duplicateDefaults(supabase, from) : undefined,
  ]);

  return (
    <>
      <PageHeader
        backHref={defaults && from ? `/invoices/${from}` : "/invoices"}
        title="New invoice"
        subtitle={
          defaults
            ? "Copied from an existing invoice — check the dates and items."
            : "Add line items and totals."
        }
      />
      <DocForm
        kind="invoice"
        customers={customers}
        action={createInvoice}
        defaults={defaults}
      />
    </>
  );
};

export default NewInvoicePage;
