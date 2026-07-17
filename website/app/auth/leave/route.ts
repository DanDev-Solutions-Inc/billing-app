import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

/**
 * Sign out and return to /login. A route handler (not a Server Component) so
 * the cleared-session cookies actually persist — the app layout redirects here
 * when a signed-in user has no access, and going straight to /login would loop
 * (the proxy bounces a logged-in user off /login before it can render).
 */
export const GET = async (request: NextRequest) => {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/login", request.nextUrl.origin);
  const reason = request.nextUrl.searchParams.get("reason");
  if (reason) url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
};
