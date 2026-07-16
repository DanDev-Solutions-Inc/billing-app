import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@typings/Supabase";

// Public paths reachable without a session.
const PUBLIC_PREFIXES = ["/login", "/signup", "/auth"];
// Route handlers that must run without a UI session (server-to-server).
const OPEN_API_PREFIXES = ["/api/inbound", "/api/cron"];

/**
 * Refreshes the Supabase session cookies on every request and performs an
 * OPTIMISTIC auth redirect. Real authorization lives in the DAL + Postgres RLS.
 *
 * Important (Supabase SSR contract): do not run logic between createServerClient
 * and getUser(), or token refresh breaks.
 */
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    OPEN_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If logged in and visiting an auth page, send them to the dashboard.
  if (user && PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) && pathname !== "/auth/confirm") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Must return supabaseResponse so refreshed cookies propagate.
  return supabaseResponse;
};
