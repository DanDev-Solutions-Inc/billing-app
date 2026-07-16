import { NextResponse } from "next/server";
import { createAdminClient } from "@lib/supabase/admin";
import { denyUnauthorizedCron } from "@lib/cron-auth";
import { generateDueInvoices } from "@services/recurring/generate-due-invoices";

export const runtime = "nodejs";

// Vercel Cron hits this daily (see vercel.json). It generates + optionally emails
// invoices for every schedule due today. Secured with CRON_SECRET.
export const GET = async (request: Request) => {
  const denied = denyUnauthorizedCron(request);
  if (denied) return denied;

  const today = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();
  const result = await generateDueInvoices(admin, today);
  return NextResponse.json({ ok: true, ...result });
};
