import { Database } from "@typings/Supabase";

export type Receipt = Database["public"]["Tables"]["receipts"]["Row"];
