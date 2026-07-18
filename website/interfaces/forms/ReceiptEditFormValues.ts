export interface ReceiptEditFormValues {
  vendor: string;
  amount: string;
  receipt_date: string;
  category: string;
  notes: string;
  /** Whether `amount` is HST-inclusive — drives the subtotal/tax breakdown. */
  tax_included: boolean;
}
