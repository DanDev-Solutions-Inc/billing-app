import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@lib/supabase/admin";
import { isAnalyzable } from "@lib/ai/analyze-receipt";
import { ingestAttachment } from "@services/receipts/ingest-attachment";
import {
  getProfileByInboundToken,
  getProfileByEmail,
} from "@services/supabase/profile";

export const runtime = "nodejs";
// Fetching + AI-reading each attachment takes longer than the default budget.
export const maxDuration = 60;

// Receives forwarded receipt emails (Resend inbound → webhook). Resolves the
// user from the `receipts+<token>@INBOUND_DOMAIN` alias, stores each image/PDF
// attachment in Vercel Blob, records a receipt (source = "email"), reads it with
// AI, and files a matching transaction — same treatment as an in-app upload.
export const POST = async (request: Request) => {
  const raw = await request.text();

  // Verify the Svix signature. This endpoint writes to storage + the DB from an
  // unauthenticated request, so in production a missing secret is a hard failure
  // rather than a silent skip — otherwise anyone could POST receipts in.
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("inbound/receipts: RESEND_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 503 },
      );
    }
    console.warn("inbound/receipts: no RESEND_WEBHOOK_SECRET — skipping signature check (dev only)");
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
  const data = (payload?.data ?? payload) as Record<string, unknown>;

  const admin = createAdminClient();

  // Who owns the receipt:
  //   1. the per-user alias token (receipts+<token>@…) — used for team members
  //   2. RECEIPTS_OWNER_USER_ID — the business inbox, so anything forwarded to
  //      the plain address is accepted regardless of which account it was sent
  //      from (people forward from whatever mail app is to hand)
  //   3. the sender's own address, as a last resort
  const recipients = collectRecipients(data);

  // Sending and receiving share one domain, so a client replying to a no-reply
  // invoice arrives here too. Only mail actually addressed to the receipts
  // mailbox may be filed — without this, a reply carrying any attachment (a
  // remittance advice, or the quoted copy of our own logo) would fall through
  // to RECEIPTS_OWNER_USER_ID below and book a bogus transaction.
  if (!recipients.some(isReceiptsAddress))
    return NextResponse.json({ ok: true, skipped: "not addressed to receipts" });

  const token = extractToken(recipients);
  const owner = process.env.RECEIPTS_OWNER_USER_ID;
  const userId = token
    ? (await getProfileByInboundToken(admin, token))?.user_id
    : (owner ?? (await matchBySender(admin, data))?.user_id);
  if (!userId)
    return NextResponse.json({ ok: true, skipped: "no owner for receipt" });

  // Resend webhooks carry attachment METADATA only — no content, no url. The
  // bytes come from the Receiving API as time-limited pre-signed download URLs.
  const emailId = typeof data.email_id === "string" ? data.email_id : null;
  const attachments = await fetchAttachments(emailId, data);
  if (attachments.length === 0)
    return NextResponse.json({ ok: true, skipped: "no receipt attachments" });

  const subject = typeof data.subject === "string" ? data.subject : null;
  let created = 0;

  const messageId = emailId ?? (typeof data.message_id === "string" ? data.message_id : null);

  for (const [index, att] of attachments.entries()) {
    const bytes = await attachmentBytes(att);
    if (!bytes) continue;

    // Store, AI-read, and file the transaction — shared with the Gmail poller
    // so both inbound paths behave identically.
    const result = await ingestAttachment(admin, {
      userId,
      filename: att.filename,
      contentType: att.contentType,
      bytes,
      subject,
      sourceMessageId: messageId ? `resend:${messageId}:${index}` : null,
    });
    if (result) created += 1;
  }

  return NextResponse.json({ ok: true, created });
};

/* --------------------------------------------------------- helpers --------- */

interface ReceiptAttachment {
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

// True for `receipts@…` and `receipts+<token>@…` only. Recipients arrive either
// bare or as "Name <addr>", so the local part is anchored to a boundary rather
// than to the start of the string.
const isReceiptsAddress = (recipient: string): boolean =>
  /(^|[<\s,;])receipts(\+[a-z0-9]+)?@/i.test(recipient);

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

/**
 * Get the attachments for an inbound email, with content we can actually read.
 *
 * Resend's webhook carries metadata ONLY — no base64 content and no url — so
 * the bytes have to be fetched from the Receiving API, which answers with
 * time-limited pre-signed download URLs. The webhook payload is used only as a
 * fallback (and for providers that do inline the content).
 */
const fetchAttachments = async (
  emailId: string | null,
  data: Record<string, unknown>,
): Promise<ReceiptAttachment[]> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (emailId && apiKey) {
    try {
      const res = await fetch(
        `https://api.resend.com/emails/receiving/${emailId}/attachments?limit=100`,
        { headers: { authorization: `Bearer ${apiKey}` } },
      );
      if (res.ok) {
        const json = (await res.json()) as { data?: unknown[] };
        const list = toAttachments(json.data);
        if (list.length > 0) return list;
      } else {
        console.error(
          `inbound/receipts: attachments API ${res.status} for ${emailId}`,
        );
      }
    } catch (error) {
      console.error("inbound/receipts: attachments API failed", error);
    }
  }
  return toAttachments(data.attachments);
};

// Keep image and PDF attachments — emailed receipts are very often PDFs.
// Anything else (signatures, .ics, docs) is ignored.
const toAttachments = (raw: unknown): ReceiptAttachment[] => {
  if (!Array.isArray(raw)) return [];
  const out: ReceiptAttachment[] = [];
  raw.forEach((a, i) => {
    if (!a || typeof a !== "object") return;
    const o = a as Record<string, unknown>;
    const filename = String(o.filename ?? o.name ?? `receipt-${i}`);
    // Some providers omit/misreport the type — fall back to the extension.
    const declared = String(o.content_type ?? o.contentType ?? "").toLowerCase();
    const contentType = isAnalyzable(declared)
      ? declared
      : typeFromExtension(filename);
    if (!contentType) return;
    out.push({
      filename,
      contentType,
      content: typeof o.content === "string" ? o.content : undefined,
      url:
        typeof o.download_url === "string"
          ? o.download_url
          : typeof o.url === "string"
            ? o.url
            : undefined,
    });
  });
  return out;
};

const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
};

const typeFromExtension = (filename: string): string | null => {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return (ext && EXT_TYPES[ext]) ?? null;
};

const attachmentBytes = async (
  att: ReceiptAttachment,
): Promise<Buffer | null> => {
  if (att.content) return Buffer.from(att.content, "base64");
  if (att.url) {
    const res = await fetch(att.url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  return null;
};
