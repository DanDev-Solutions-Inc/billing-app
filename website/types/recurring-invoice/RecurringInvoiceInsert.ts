import { Database } from "@typings/Supabase";

export type RecurringInvoiceInsert =
  Database["public"]["Tables"]["recurring_invoices"]["Insert"];
