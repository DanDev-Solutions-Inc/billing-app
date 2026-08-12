import { CurrencyCode } from "@typings/CurrencyCode";

export interface RecordPaymentButtonProps {
  id: string;
  /** What's still owed, in the invoice's currency. Seeds the amount field. */
  balance: number;
  currency: CurrencyCode;
  className?: string;
}
