import { CurrencyCode } from "@typings/CurrencyCode";

export interface EmailInvoiceInput {
  /** The schedule's owner — the cron has no session, so it can't be inferred. */
  userId: string;
  customerId: string;
  invoiceId: string;
  invoiceNumber: string | null;
  issueDate: string;
  dueDate: string | null;
  currency: CurrencyCode;
  /** The totals actually stored on the invoice — never recomputed for the PDF. */
  totals: { subtotal: number; tax: number; total: number };
  notes: string | null;
  /** The schedule's chosen recipient, or null to follow the customer's primary. */
  sendTo: string | null;
}
