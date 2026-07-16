// Import Wave receipt export → Vercel Blob + receipts table, linking each to the
// matching expense transaction. Idempotent (skips receipts already uploaded).
//   set -a; source .env.local; set +a
//   RECEIPTS_DIR="/path/to/export" RECEIPTS_USER_ID=<uuid> node scripts/import-receipts.mjs
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  BLOB_READ_WRITE_TOKEN,
  RECEIPTS_DIR,
  RECEIPTS_USER_ID: userId,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BLOB_READ_WRITE_TOKEN || !RECEIPTS_DIR || !userId) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BLOB_READ_WRITE_TOKEN, RECEIPTS_DIR, RECEIPTS_USER_ID");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const CONTENT_TYPE = { ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };
const CONCURRENCY = 8;

const parseName = (filename) => {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.(pdf|jpe?g|png)$/i);
  if (!m) return null;
  const date = m[1];
  const vendor = m[2].replace(/\(\d+\)$/, "").replace(/_/g, " ").trim();
  return { date, vendor, ext: "." + m[3].toLowerCase() };
};

// Existing Blob pathnames for this user (idempotency across re-runs).
const loadExisting = async () => {
  const set = new Set();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("receipts").select("image_pathname").eq("user_id", userId).range(from, from + 999);
    if (!data || data.length === 0) break;
    data.forEach((r) => r.image_pathname && set.add(r.image_pathname));
    if (data.length < 1000) break;
  }
  return set;
};

const run = async () => {
  const files = fs.readdirSync(RECEIPTS_DIR).filter((f) => !f.startsWith("."));
  console.log(`${files.length} files; loading existing receipts…`);
  const existing = await loadExisting();
  console.log(`${existing.size} already imported`);

  let idx = 0, done = 0, created = 0, linked = 0, skipped = 0, failed = 0;

  const processOne = async (filename) => {
    const parsed = parseName(filename);
    if (!parsed) { skipped++; return; }
    const pathname = `receipts/${userId}/${filename}`;
    if (existing.has(pathname)) { skipped++; return; }

    try {
      const buffer = fs.readFileSync(path.join(RECEIPTS_DIR, filename));
      const blob = await put(pathname, buffer, {
        access: "private", addRandomSuffix: false,
        contentType: CONTENT_TYPE[parsed.ext] ?? "application/octet-stream",
        token: BLOB_READ_WRITE_TOKEN,
      });

      const { data: receipt, error } = await sb.from("receipts").insert({
        user_id: userId, vendor: parsed.vendor, amount: 0,
        receipt_date: parsed.date, source: "upload",
        image_url: blob.url, image_pathname: blob.pathname,
      }).select("id").single();
      if (error) { failed++; console.error(filename, error.message); return; }
      created++;

      // Best-effort link to an unlinked expense transaction on the same date.
      const { data: txn } = await sb.from("transactions").select("id")
        .eq("user_id", userId).eq("txn_date", parsed.date).eq("direction", "expense")
        .is("receipt_id", null).ilike("description", `%${parsed.vendor.split(" ")[0]}%`).limit(1).maybeSingle();
      if (txn) {
        await sb.from("transactions").update({ receipt_id: receipt.id }).eq("id", txn.id);
        linked++;
      }
    } catch (e) {
      failed++;
      console.error(filename, e.message);
    }
  };

  const worker = async () => {
    while (idx < files.length) {
      const f = files[idx++];
      await processOne(f);
      if (++done % 100 === 0)
        console.log(`  ${done}/${files.length} — created ${created}, linked ${linked}, skipped ${skipped}, failed ${failed}`);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Done. created ${created}, linked ${linked}, skipped ${skipped}, failed ${failed}`);
};

run().catch((e) => { console.error(e); process.exit(1); });
