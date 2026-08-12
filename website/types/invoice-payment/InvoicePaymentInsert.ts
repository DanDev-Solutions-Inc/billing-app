import { Database } from "@typings/Supabase";

export type InvoicePaymentInsert =
  Database["public"]["Tables"]["invoice_payments"]["Insert"];
