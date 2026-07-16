import { NextResponse } from "next/server";
import { createAdminClient } from "@lib/supabase/admin";
import { denyUnauthorizedCron } from "@lib/cron-auth";
import { pollReceiptsMailbox } from "@services/gmail/poll-receipts";

export const runtime = "nodejs";
// Reading + AI-analysing several attachments takes longer than the default.
export const maxDuration = 60;

// Vercel Cron hits this hourly (see vercel.json). It polls the dedicated
// receipts@ mailbox and imports any new attachments as receipts + transactions.
// Secured with CRON_SECRET.
export const GET = async (request: Request) => {
  const denied = denyUnauthorizedCron(request);
  if (denied) return denied;

  const admin = createAdminClient();
  const result = await pollReceiptsMailbox(admin);
  if (result.error) return NextResponse.json(result, { status: 500 });
  return NextResponse.json({ ok: true, ...result });
};
