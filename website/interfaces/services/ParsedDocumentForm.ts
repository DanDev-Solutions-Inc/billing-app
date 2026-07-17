import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@typings/SupabaseClient";
import { CurrencyCode } from "@typings/CurrencyCode";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

export interface ParsedDocumentForm {
  user: User;
  supabase: SupabaseClient;
  items: LineItemFormValues[];
  currency: CurrencyCode;
  totals: { subtotal: number; tax: number; total: number };
  issueDate: string;
  /** Rate to CAD stamped on the row; 1 for CAD. */
  exchangeRate: number;
  customerId: string | null;
  number: string | null;
  /** Due date for an invoice, expiry for an estimate — the form field is shared. */
  secondDate: string | null;
  notes: string | null;
}
