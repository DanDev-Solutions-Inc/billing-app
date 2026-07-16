import { Database } from "@typings/Supabase";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];
