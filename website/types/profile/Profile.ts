import { Database } from "@typings/Supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
