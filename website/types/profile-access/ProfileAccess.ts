import { Database } from "@typings/Supabase";

export type ProfileAccess =
  Database["public"]["Tables"]["profile_access"]["Row"];
