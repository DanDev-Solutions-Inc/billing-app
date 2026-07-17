import { Transaction } from "@typings/transaction/Transaction";

export interface TransactionEditFormProps {
  transaction: Transaction;
  /** Standard categories, plus this row's own if it's an imported one. */
  categories: readonly string[];
  /** Descriptions already in use — suggestions, not a constraint. */
  descriptions?: string[];
}
