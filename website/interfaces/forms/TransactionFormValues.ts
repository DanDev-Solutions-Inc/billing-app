export interface TransactionFormValues {
  direction: "income" | "expense";
  amount: string;
  txn_date: string;
  category: string;
  description: string;
  /** Whether `amount` is HST-inclusive — drives the subtotal/tax breakdown. */
  tax_included: boolean;
}
