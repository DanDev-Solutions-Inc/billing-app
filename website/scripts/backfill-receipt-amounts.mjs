// Copy amount / category / vendor from each transaction onto its linked receipt.
// Receipts were imported with amount 0; the real figure lives on the expense
// transaction they're linked to (transaction.receipt_id = receipt.id).
//
// Only fills receipt fields that are empty (amount 0/null, category null,
// vendor null) — idempotent. Dry-run by default.
//
//   set -a; source .env.local; set +a
//   WAVE_IMPORT_USER_ID=<uuid> node scripts/backfill-receipt-amounts.mjs         # dry run
//   WAVE_IMPORT_USER_ID=<uuid> APPLY=1 node scripts/backfill-receipt-amounts.mjs # write
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID } = process.env;
const APPLY = process.env.APPLY === "1";
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WAVE_IMPORT_USER_ID) {
  console.error("Missing env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID)");
  process.exit(1);
}
const userId = WAVE_IMPORT_USER_ID;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const fetchAll = async (table, columns, extra = (q) => q) => {
  const out = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await extra(
      sb.from(table).select(columns).eq("user_id", userId).range(from, from + size - 1),
    );
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return out;
};

const run = async () => {
  console.log(APPLY ? "APPLY mode — writing changes." : "DRY RUN — no writes. Set APPLY=1 to write.");

  const txns = await fetchAll(
    "transactions",
    "amount, category, description, receipt_id",
    (q) => q.not("receipt_id", "is", null),
  );
  const receipts = await fetchAll("receipts", "id, vendor, amount, category");
  const byId = new Map(receipts.map((r) => [r.id, r]));

  let updated = 0, skipped = 0;
  for (const t of txns) {
    const r = byId.get(t.receipt_id);
    if (!r) continue;
    const patch = {};
    if ((!r.amount || Number(r.amount) === 0) && t.amount && Number(t.amount) > 0)
      patch.amount = t.amount;
    if (!r.category && t.category) patch.category = t.category;
    if (!r.vendor && t.description) patch.vendor = t.description;
    if (Object.keys(patch).length === 0) { skipped++; continue; }
    updated++;
    if (APPLY) await sb.from("receipts").update(patch).eq("id", r.id);
  }
  console.log(`  linked receipts: ${txns.length}, ${updated} to update, ${skipped} already complete`);
  console.log("Done.");
};

run().catch((e) => { console.error(e); process.exit(1); });
