import { RECEIPT_CATEGORIES } from "@utils/constants";

export interface ReceiptAnalysis {
  is_receipt: boolean;
  vendor: string | null;
  amount: number | null;
  date: string | null; // yyyy-mm-dd
  category: (typeof RECEIPT_CATEGORIES)[number] | null;
}
