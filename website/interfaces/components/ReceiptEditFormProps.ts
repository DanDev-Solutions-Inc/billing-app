import { Receipt } from "@typings/receipt/Receipt";

export interface ReceiptEditFormProps {
  receipt: Receipt;
  /** Standard categories, plus this receipt's own if it's an imported one. */
  categories: readonly string[];
}
