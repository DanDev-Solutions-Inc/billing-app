import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listCustomers } from "@services/supabase/customer";
import { PageHeader } from "@components/ui";
import { DocForm } from "@components/doc-form";
import { createInvoice } from "../actions";

export const metadata: Metadata = { title: "New invoice" };

const NewInvoicePage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();
  const customers = await listCustomers(supabase);

  return (
    <>
      <PageHeader
        backHref="/invoices"
        title="New invoice"
        subtitle="Add line items and totals."
      />
      <DocForm kind="invoice" customers={customers} action={createInvoice} />
    </>
  );
};

export default NewInvoicePage;
