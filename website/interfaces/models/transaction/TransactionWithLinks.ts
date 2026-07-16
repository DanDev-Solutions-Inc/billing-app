import { Transaction } from "@typings/transaction/Transaction";

export interface TransactionWithLinks extends Transaction {
  receipts: { vendor: string | null } | null;
  invoices: { invoice_number: string | null } | null;
}
