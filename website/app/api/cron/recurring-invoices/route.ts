import { NextResponse } from "next/server";
import { createAdminClient } from "@lib/supabase/admin";
import { generateDueInvoices } from "@services/recurring/generate-due-invoices";

export const runtime = "nodejs";

// Vercel Cron hits this daily (see vercel.json). It generates + optionally emails
// invoices for every schedule due today. Secured with CRON_SECRET.
export const GET = async (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();
  const result = await generateDueInvoices(admin, today);
  return NextResponse.json({ ok: true, ...result });
};
