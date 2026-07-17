import { Metadata } from "next";
import { getUserOrRedirect } from "@lib/dal";
import { PageHeader } from "@components/ui";
import { TransactionForm } from "@components/transaction-form";

export const metadata: Metadata = { title: "New transaction" };

const NewTransactionPage = async () => {
  await getUserOrRedirect();

  return (
    <>
      <PageHeader
        backHref="/transactions"
        title="New transaction"
        subtitle="Record income or an expense manually."
      />
      <TransactionForm />
    </>
  );
};

export default NewTransactionPage;
