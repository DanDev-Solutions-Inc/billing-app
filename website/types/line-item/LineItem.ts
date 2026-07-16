import { Database } from "@typings/Supabase";

export type LineItem = Database["public"]["Tables"]["line_items"]["Row"];
