import { CurrencyCode } from "@typings/CurrencyCode";

import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { RecurringFrequency } from "@typings/recurring-invoice/RecurringFrequency";

export interface RecurringFormValues {
  currency: CurrencyCode;
  customer_id: string;
  title: string;
  frequency: RecurringFrequency;
  interval: number;
  next_run: string;
  net_days: number;
  auto_send: boolean;
  /** "" = follow the customer's primary address. */
  send_to: string;
  end_date: string;
  notes: string;
  tax_rate: number;
  items: LineItemFormValues[];
}
