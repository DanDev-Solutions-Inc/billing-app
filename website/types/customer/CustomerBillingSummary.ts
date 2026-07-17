import { Database } from "@typings/Supabase";

export type CustomerBillingSummary =
  Database["public"]["Views"]["customer_billing_summary"]["Row"];
