import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

export interface DocumentFormValues {
  customer_id: string;
  number: string;
  issue_date: string;
  second_date: string;
  notes: string;
  tax_rate: number;
  items: LineItemFormValues[];
}
