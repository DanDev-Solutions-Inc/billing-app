import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { put } from "@vercel/blob";
import { createAdminClient } from "@lib/supabase/admin";
import {
  getProfileByInboundToken,
  getProfileByEmail,
} from "@services/supabase/profile";

export const runtime = "nodejs";

// Receives forwarded receipt emails (Resend inbound → webhook). Resolves the
// user from the `receipts+<token>@INBOUND_DOMAIN` alias, stores each image
// attachment in Vercel Blob, and records a receipt (source = "email").
export const POST = async (request: Request) => {
  const raw = await request.text();

  // Verify the Svix signature when a secret is configured.
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
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
  const data = (payload?.data ?? payload) as Record<string, unknown>;

  const admin = createAdminClient();

  // Prefer the per-user alias token (receipts+<token>@…); otherwise fall back to
  // matching the sender's address (plain receipts@dandev.solutions).
  const token = extractToken(collectRecipients(data));
  const profile = token
    ? await getProfileByInboundToken(admin, token)
    : await matchBySender(admin, data);
  if (!profile)
    return NextResponse.json({ ok: true, skipped: "unrecognised sender" });

  const attachments = extractImageAttachments(data);
  if (attachments.length === 0)
    return NextResponse.json({ ok: true, skipped: "no image attachments" });

  const subject = typeof data.subject === "string" ? data.subject : null;
  let created = 0;

  for (const att of attachments) {
    const bytes = await attachmentBytes(att);
    if (!bytes) continue;

    const blob = await put(
      `receipts/${profile.user_id}/${att.filename}`,
      bytes,
      { access: "private", addRandomSuffix: true, contentType: att.contentType },
    );

    await admin.from("receipts").insert({
      user_id: profile.user_id,
      vendor: null,
      amount: 0,
      source: "email",
      notes: subject,
      image_url: blob.url,
      image_pathname: blob.pathname,
    });
    created += 1;
  }

  return NextResponse.json({ ok: true, created });
};

/* --------------------------------------------------------- helpers --------- */

interface ImageAttachment {
  filename: string;
  contentType: string;
  content?: string; // base64
  url?: string;
}

const safeJson = (raw: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const collectRecipients = (data: Record<string, unknown>): string[] => {
  const out: string[] = [];
  for (const key of ["to", "cc", "recipient", "recipients"]) {
    const value = data[key];
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === "string") out.push(v);
        else if (v && typeof v === "object") {
          const addr =
            (v as Record<string, unknown>).address ??
            (v as Record<string, unknown>).email;
          if (typeof addr === "string") out.push(addr);
        }
      }
    }
  }
  return out;
};

const extractToken = (recipients: string[]): string | null => {
  for (const r of recipients) {
    const match = r.match(/receipts\+([a-z0-9]+)@/i);
    if (match) return match[1];
  }
  return null;
};

// Pull the sender email out of `from` (string "Name <a@b>" or { address }).
const extractSenderEmail = (data: Record<string, unknown>): string | null => {
  const from = data.from ?? data.sender;
  const raw =
    typeof from === "string"
      ? from
      : from && typeof from === "object"
        ? String(
            (from as Record<string, unknown>).address ??
              (from as Record<string, unknown>).email ??
              "",
          )
        : "";
  const match = raw.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0] : null;
};

const matchBySender = async (
  admin: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>,
) => {
  const email = extractSenderEmail(data);
  return email ? getProfileByEmail(admin, email) : null;
};

const extractImageAttachments = (
  data: Record<string, unknown>,
): ImageAttachment[] => {
  const raw = data.attachments;
  if (!Array.isArray(raw)) return [];
  const out: ImageAttachment[] = [];
  raw.forEach((a, i) => {
    if (!a || typeof a !== "object") return;
    const o = a as Record<string, unknown>;
    const contentType = String(o.content_type ?? o.contentType ?? "");
    if (!contentType.startsWith("image/")) return;
    out.push({
      filename: String(o.filename ?? o.name ?? `receipt-${i}.jpg`),
      contentType,
      content: typeof o.content === "string" ? o.content : undefined,
      url:
        typeof o.url === "string"
          ? o.url
          : typeof o.download_url === "string"
            ? o.download_url
            : undefined,
    });
  });
  return out;
};

const attachmentBytes = async (
  att: ImageAttachment,
): Promise<Buffer | null> => {
  if (att.content) return Buffer.from(att.content, "base64");
  if (att.url) {
    const res = await fetch(att.url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  return null;
};
