import { Database } from "@typings/Supabase";

export type InvoicePayment =
  Database["public"]["Tables"]["invoice_payments"]["Row"];
