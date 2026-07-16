import { Database } from "@typings/Supabase";

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
