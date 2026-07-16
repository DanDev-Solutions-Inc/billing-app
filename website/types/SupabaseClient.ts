import { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@typings/Supabase";

// The app-wide Supabase client, typed to our schema. Passed into
// services/supabase/* functions (dependency injection) so DB access is
// isolated to that layer and easy to test.
export type SupabaseClient = BaseSupabaseClient<Database>;
