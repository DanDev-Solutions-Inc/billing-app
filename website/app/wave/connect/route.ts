import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@lib/dal";
import { buildAuthorizeUrl } from "@lib/wave/client";

export const runtime = "nodejs";

// Starts the Wave OAuth flow: stores a CSRF state cookie and redirects to Wave.
export const GET = async (request: Request) => {
  const origin = new URL(request.url).origin;
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const state = crypto.randomUUID();
  const store = await cookies();
  store.set("wave_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildAuthorizeUrl(state));
};
