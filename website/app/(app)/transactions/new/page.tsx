import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listDescriptions } from "@services/supabase/transaction";
import { PageHeader } from "@components/ui";
import { TransactionForm } from "@components/transaction-form";

export const metadata: Metadata = { title: "New transaction" };

const NewTransactionPage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();
  /* Existing descriptions, most-used first — suggested while typing so the same
     vendor doesn't accumulate three spellings. */
  const descriptions = await listDescriptions(supabase);

  return (
    <>
      <PageHeader
        backHref="/transactions"
        title="New transaction"
        subtitle="Record income or an expense manually."
      />
      <TransactionForm descriptions={descriptions} />
    </>
  );
};

export default NewTransactionPage;
