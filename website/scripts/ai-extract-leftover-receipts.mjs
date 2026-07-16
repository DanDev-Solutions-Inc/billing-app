// Run Claude vision over receipts that still have no amount (the ones with no
// matching bank transaction), fill in amount/vendor/date/category, and create a
// linked expense transaction (status = 'pending') so each shows in the ledger.
//
// Handles both images (jpg/png/webp) and PDFs (document block).
// LIMIT lets you test on a few first; APPLY=1 writes (otherwise prints only).
//
//   set -a; source .env.local; set +a
//   ANTHROPIC_API_KEY=sk-... WAVE_IMPORT_USER_ID=<uuid> LIMIT=3 node scripts/ai-extract-leftover-receipts.mjs
//   ANTHROPIC_API_KEY=sk-... WAVE_IMPORT_USER_ID=<uuid> APPLY=1 node scripts/ai-extract-leftover-receipts.mjs
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID, BLOB_READ_WRITE_TOKEN, ANTHROPIC_API_KEY } = process.env;
const APPLY = process.env.APPLY === "1";
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WAVE_IMPORT_USER_ID || !ANTHROPIC_API_KEY) {
  console.error("Missing env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID, ANTHROPIC_API_KEY)");
  process.exit(1);
}
const userId = WAVE_IMPORT_USER_ID;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ai = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const CATEGORIES = [
  "Software & Subscriptions", "Hardware & Equipment", "Office Supplies", "Travel",
  "Meals & Entertainment", "Contractors", "Advertising & Promotion", "Professional Fees",
  "Utilities", "Vehicle & Fuel", "Bank & Merchant Fees", "Other",
];
const PROMPT = `You are reading a business expense receipt. Return ONLY a JSON object (no prose, no code fence) with keys:
  is_receipt (boolean), vendor (string|null), amount (number|null, the grand total incl. tax),
  date (string|null, YYYY-MM-DD), category (one of: ${CATEGORIES.join(", ")}, or null).
If it is not a receipt/invoice, set is_receipt=false and the rest null.`;

const mediaFor = (pathname) => {
  const ext = (pathname.toLowerCase().match(/\.([a-z0-9]+)(\?|$)/)?.[1]) ?? "";
  if (ext === "pdf") return { kind: "pdf", media: "application/pdf" };
  if (ext === "png") return { kind: "image", media: "image/png" };
  if (ext === "webp") return { kind: "image", media: "image/webp" };
  return { kind: "image", media: "image/jpeg" };
};

const fetchBlob = async (url) => {
  const res = await fetch(url, { headers: { authorization: `Bearer ${BLOB_READ_WRITE_TOKEN}` } });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer()).toString("base64");
};

const extract = async (base64, { kind, media }) => {
  const block =
    kind === "pdf"
      ? { type: "document", source: { type: "base64", media_type: media, data: base64 } }
      : { type: "image", source: { type: "base64", media_type: media, data: base64 } };
  const msg = await ai.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 512,
    messages: [{ role: "user", content: [block, { type: "text", text: PROMPT }] }],
  });
  const text = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
};

const run = async () => {
  console.log(APPLY ? "APPLY mode — writing." : "PREVIEW — no writes. Set APPLY=1 to write.");
  const { data: receipts } = await sb
    .from("receipts")
    .select("id, vendor, image_url, image_pathname, receipt_date, category")
    .eq("user_id", userId)
    .or("amount.is.null,amount.eq.0");

  const todo = (receipts ?? []).filter((r) => r.image_url).slice(0, LIMIT);
  console.log(`  ${todo.length} receipts to process`);

  let filled = 0, notReceipt = 0, failed = 0;
  for (const r of todo) {
    const info = mediaFor(r.image_pathname ?? r.image_url);
    const base64 = await fetchBlob(r.image_url);
    if (!base64) { failed++; console.log(`  ! ${r.vendor}: blob fetch failed`); continue; }
    let a;
    try { a = await extract(base64, info); } catch (e) { failed++; console.log(`  ! ${r.vendor}: ${e.message}`); continue; }
    if (!a || !a.is_receipt || !(a.amount > 0)) { notReceipt++; console.log(`  - ${r.vendor}: no amount (is_receipt=${a?.is_receipt})`); continue; }

    const vendor = r.vendor ?? a.vendor ?? null;
    const category = r.category ?? a.category ?? null;
    const date = r.receipt_date ?? a.date ?? null;
    console.log(`  ✓ ${vendor} — $${a.amount} ${category ?? ""} ${date ?? ""}`);
    filled++;
    if (APPLY) {
      await sb.from("receipts").update({ amount: a.amount, vendor, category, receipt_date: date ?? undefined }).eq("id", r.id);
      // Create a linked expense transaction if none references this receipt yet.
      const { data: existing } = await sb.from("transactions").select("id").eq("receipt_id", r.id).maybeSingle();
      if (!existing) {
        await sb.from("transactions").insert({
          user_id: userId, txn_date: date ?? new Date().toISOString().slice(0, 10),
          description: vendor ? `Receipt — ${vendor}` : "Receipt expense",
          amount: a.amount, direction: "expense", category, receipt_id: r.id,
        });
      }
    }
  }
  console.log(`Done. ${filled} filled, ${notReceipt} no amount, ${failed} failed.`);
};

run().catch((e) => { console.error(e); process.exit(1); });
