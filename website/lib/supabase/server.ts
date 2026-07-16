import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@typings/Supabase";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Next 16: cookies() is async. Setting cookies during a pure RSC render throws,
 * so setAll is wrapped in try/catch — the proxy refreshes the session instead.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — safe to ignore.
            // The proxy (proxy.ts) writes the refreshed session cookies.
          }
        },
      },
    },
  );
};
