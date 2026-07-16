import { Database } from "@typings/Supabase";

export type RecurringInvoice =
  Database["public"]["Tables"]["recurring_invoices"]["Row"];
