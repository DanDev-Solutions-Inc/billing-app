import "server-only";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@typings/Supabase";

/**
 * Service-role Supabase client — BYPASSES RLS. Server-only, and used solely by
 * the inbound-email webhook, where there is no logged-in session to scope by.
 * Never import this into anything reachable from the browser.
 */
export const createAdminClient = () =>
  createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
