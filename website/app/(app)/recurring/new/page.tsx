import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listCustomers } from "@services/supabase/customer";
import { PageHeader } from "@components/ui";
import { RecurringInvoiceForm } from "@components/recurring-invoice-form";
import { createRecurringInvoice } from "../actions";

export const metadata: Metadata = { title: "New recurring invoice" };

const NewRecurringPage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();
  const customers = await listCustomers(supabase);

  return (
    <>
      <PageHeader
        title="New recurring invoice"
        subtitle="Automatically generate and email invoices on a schedule."
      />
      <RecurringInvoiceForm
        customers={customers}
        action={createRecurringInvoice}
      />
    </>
  );
};

export default NewRecurringPage;
