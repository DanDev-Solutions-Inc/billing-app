import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

import { CurrencyCode } from "@typings/CurrencyCode";

export interface DocumentFormValues {
  currency: CurrencyCode;
  customer_id: string;
  number: string;
  issue_date: string;
  second_date: string;
  notes: string;
  tax_rate: number;
  items: LineItemFormValues[];
}
