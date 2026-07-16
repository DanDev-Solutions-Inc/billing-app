import { Database } from "@typings/Supabase";

export type Estimate = Database["public"]["Tables"]["estimates"]["Row"];
