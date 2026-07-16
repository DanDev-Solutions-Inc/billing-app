import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { put } from "@vercel/blob";
import { createAdminClient } from "@lib/supabase/admin";
import { analyzeReceipt, isAnalyzable } from "@lib/ai/analyze-receipt";
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

  // Prefer the per-user alias token (receipts+<token>@…); otherwise fall back to
  // matching the sender's address (plain receipts@dandev.solutions).
  const token = extractToken(collectRecipients(data));
  const profile = token
    ? await getProfileByInboundToken(admin, token)
    : await matchBySender(admin, data);
  if (!profile)
    return NextResponse.json({ ok: true, skipped: "unrecognised sender" });

  const attachments = extractReceiptAttachments(data);
  if (attachments.length === 0)
    return NextResponse.json({ ok: true, skipped: "no receipt attachments" });

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

    // Read the receipt so it arrives with real values rather than a blank row.
    // The bytes are already in hand — no need to re-fetch the blob.
    const analysis = await analyzeReceipt(
      bytes.toString("base64"),
      att.contentType,
    );
    const usable = analysis?.is_receipt ? analysis : null;
    const amount = usable?.amount != null ? Math.abs(usable.amount) : 0;

    const { data: receipt } = await admin
      .from("receipts")
      .insert({
        user_id: profile.user_id,
        vendor: usable?.vendor ?? null,
        amount,
        receipt_date: usable?.date ?? undefined,
        category: usable?.category ?? null,
        source: "email",
        notes: subject,
        image_url: blob.url,
        image_pathname: blob.pathname,
      })
      .select("id")
      .single();

    // File it in the ledger, pending review. A refund is money coming back, so
    // it books as income; a $0 receipt moves no money and gets no transaction.
    if (receipt && amount > 0) {
      const vendor = usable?.vendor;
      await admin.from("transactions").insert({
        user_id: profile.user_id,
        txn_date: usable?.date ?? new Date().toISOString().slice(0, 10),
        description: vendor
          ? `${usable?.is_refund ? "Refund" : "Receipt"} — ${vendor}`
          : "Emailed receipt",
        amount,
        direction: usable?.is_refund ? "income" : "expense",
        status: "pending",
        category: usable?.category ?? null,
        receipt_id: receipt.id,
      });
    }
    created += 1;
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

// Keep image and PDF attachments — emailed receipts are very often PDFs.
// Anything else (signatures, .ics, docs) is ignored.
const extractReceiptAttachments = (
  data: Record<string, unknown>,
): ReceiptAttachment[] => {
  const raw = data.attachments;
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
        typeof o.url === "string"
          ? o.url
          : typeof o.download_url === "string"
            ? o.download_url
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
