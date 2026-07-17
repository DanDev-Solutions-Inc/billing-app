import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listCustomers } from "@services/supabase/customer";
import { PageHeader } from "@components/ui";
import { DocForm } from "@components/doc-form";
import { createEstimate } from "../actions";

export const metadata: Metadata = { title: "New estimate" };

const NewEstimatePage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();
  const customers = await listCustomers(supabase);

  return (
    <>
      <PageHeader
        backHref="/estimates"
        title="New estimate"
        subtitle="Quote work for a customer."
      />
      <DocForm kind="estimate" customers={customers} action={createEstimate} />
    </>
  );
};

export default NewEstimatePage;
