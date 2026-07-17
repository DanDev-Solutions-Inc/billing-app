import { ReceiptSource } from "@typings/receipt/ReceiptSourceValue";

export interface ReceiptFilters {
  source?: ReceiptSource;
  /** Exact match on the receipt's category. */
  category?: string;
  /** Inclusive lower bound on receipt_date (yyyy-mm-dd) — the period window. */
  from?: string;
  /** Free text over vendor, category and notes. */
  search?: string;
  page?: number;
  pageSize?: number;
}
