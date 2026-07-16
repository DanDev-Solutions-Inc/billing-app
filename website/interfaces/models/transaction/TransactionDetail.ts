import { Transaction } from "@typings/transaction/Transaction";

export interface TransactionDetail extends Transaction {
  receipts: {
    id: string;
    vendor: string | null;
    image_url: string | null;
    receipt_date: string | null;
    amount: number | null;
    category: string | null;
  } | null;
  invoices: {
    id: string;
    invoice_number: string | null;
    total: number | null;
  } | null;
}
