import { type NextRequest } from "next/server";
import { updateSession } from "@lib/supabase/proxy";

// Next 16: this file replaces `middleware.ts`. Refreshes the Supabase session
// and does an optimistic auth redirect. Real authz is enforced in the DAL + RLS.
export const proxy = async (request: NextRequest) => updateSession(request);

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
