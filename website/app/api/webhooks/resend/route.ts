import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@lib/supabase/admin";
import { stampDocumentEmailEvent } from "@services/supabase/document-email";

export const runtime = "nodejs";

/**
 * Resend delivery events for mail we sent (opened / delivered / bounced), as
 * opposed to /api/inbound/receipts, which receives mail sent *to* us.
 *
 * Each event carries the `email_id` that emails.send() returned, which is how it
 * finds the document_emails row recorded at send time. Events for mail we didn't
 * record are ignored, not errors.
 */
export const POST = async (request: Request) => {
  const raw = await request.text(); // raw body — parsing first breaks the signature

  // Same posture as the receipts webhook: this writes to the DB from an
  // unauthenticated request, so in production a missing secret is a hard failure
  // rather than a silent skip.
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("webhooks/resend: RESEND_WEBHOOK_SECRET is not set");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    console.warn("webhooks/resend: no RESEND_WEBHOOK_SECRET — skipping signature check (dev only)");
  } else {
    try {
      new Webhook(secret).verify(raw, {
        "svix-id": request.headers.get("svix-id") ?? "",
        "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
        "svix-signature": request.headers.get("svix-signature") ?? "",
      });
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = safeJson(raw);
  if (!payload) return NextResponse.json({ error: "Bad payload" }, { status: 400 });

  // Resend names events past-tense and dot-namespaced: email.opened, email.delivered.
  const type = String(payload.type ?? "").replace(/^email\./, "");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const emailId = typeof data.email_id === "string" ? data.email_id : null;
  if (!emailId) return NextResponse.json({ ok: true, skipped: "no email_id" });

  const stamped = await stampDocumentEmailEvent(createAdminClient(), emailId, {
    type,
    // The event's own time. `data.created_at` is when the *email* was created,
    // which for an open is the send time, not the open time.
    occurredAt: asTimestamp(payload.created_at) ?? new Date().toISOString(),
    reason: bounceReason(data),
  });

  // Always 200: a 4xx/5xx makes Svix retry, and neither an untracked email nor
  // an event type we ignore is worth redelivering.
  return NextResponse.json({ ok: true, type, stamped });
};

const safeJson = (raw: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const asTimestamp = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
};

// Bounces nest the human-readable reason under `bounce`; everything else has none.
const bounceReason = (data: Record<string, unknown>): string | null => {
  const bounce = data.bounce;
  if (!bounce || typeof bounce !== "object") return null;
  const message = (bounce as Record<string, unknown>).message;
  return typeof message === "string" ? message : null;
};
