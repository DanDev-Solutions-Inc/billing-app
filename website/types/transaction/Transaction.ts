import { Database } from "@typings/Supabase";

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
