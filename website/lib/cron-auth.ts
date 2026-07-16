import "server-only";
import { NextResponse } from "next/server";

/**
 * Guard a Vercel Cron endpoint. Vercel sends `Authorization: Bearer $CRON_SECRET`.
 *
 * These endpoints act on real data (generating + emailing invoices, importing
 * receipts), so an unset secret is a hard failure in production rather than a
 * silent skip — otherwise the route would be open to anyone who knows the URL.
 *
 * Returns a response to send back, or null when the caller is authorised.
 */
export const denyUnauthorizedCron = (request: Request): NextResponse | null => {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("cron: CRON_SECRET is not set — refusing to run");
      return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
    }
    console.warn("cron: no CRON_SECRET — skipping auth check (dev only)");
    return null;
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
};
