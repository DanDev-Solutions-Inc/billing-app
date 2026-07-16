import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@lib/supabase/server";

// OAuth (Google) callback: exchanges the code for a session, then redirects.
export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/login?error=oauth", origin));
};
