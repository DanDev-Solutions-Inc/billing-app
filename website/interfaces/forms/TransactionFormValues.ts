export interface TransactionFormValues {
  direction: "income" | "expense";
  amount: string;
  txn_date: string;
  category: string;
  description: string;
}
