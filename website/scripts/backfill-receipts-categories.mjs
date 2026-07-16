// Backfill pass over imported data:
//   1. Fill `category` on expense transactions that are missing one, using the
//      Wave accounting.csv (the Expense-account line's Account Name = category).
//   2. Link any still-unlinked receipt to a matching expense transaction
//      (same vendor + date) that has no receipt yet, and copy the receipt's
//      amount/category back onto the receipt row so it shows real data.
//
// Idempotent + safe: only fills NULLs and only links receipts/transactions that
// are currently unlinked. Dry-run by default — prints what it *would* do.
//
//   set -a; source .env.local; set +a
//   WAVE_IMPORT_USER_ID=<uuid> node scripts/backfill-receipts-categories.mjs        # dry run
//   WAVE_IMPORT_USER_ID=<uuid> APPLY=1 node scripts/backfill-receipts-categories.mjs # write
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID } = process.env;
const APPLY = process.env.APPLY === "1";
const CSV_PATH =
  process.env.ACCOUNTING_CSV ?? "/Users/danielkarpienia/Downloads/transactions/accounting.csv";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WAVE_IMPORT_USER_ID) {
  console.error("Missing env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID)");
  process.exit(1);
}
const userId = WAVE_IMPORT_USER_ID;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// --- tiny CSV parser (handles quoted fields with commas) -------------------
const parseCsv = (text) => {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
};

// Fetch every row of a table for this user, paging past the 1000-row cap.
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

  // ---- 1. category backfill from accounting.csv --------------------------
  const rows = parseCsv(readFileSync(CSV_PATH, "utf8"));
  const header = rows[0];
  const col = (name) => header.indexOf(name);
  const iDate = col("Transaction Date");
  const iDesc = col("Transaction Description");
  const iAccount = col("Account Name");
  const iGroup = col("Account Group");

  // key: date|normDesc -> category (Account Name of the Expense-group line)
  const catMap = new Map();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row[iGroup] !== "Expense") continue;
    const key = `${row[iDate]}|${norm(row[iDesc])}`;
    if (!catMap.has(key)) catMap.set(key, row[iAccount]);
  }
  console.log(`  accounting.csv: ${catMap.size} expense category keys`);

  const expenses = await fetchAll(
    "transactions",
    "id, txn_date, description, amount, category, receipt_id, direction",
    (q) => q.eq("direction", "expense"),
  );
  // Rows with no expense-group line in Wave are transfers / e-transfers /
  // investment moves — label them so no transaction is left without a category.
  const FALLBACK = process.env.FALLBACK_CATEGORY ?? "Uncategorized";
  const uncategorised = expenses.filter((t) => !t.category);
  let catFilled = 0, catFallback = 0;
  for (const t of uncategorised) {
    const cat = catMap.get(`${t.txn_date}|${norm(t.description)}`);
    if (cat) catFilled++; else catFallback++;
    if (APPLY)
      await sb.from("transactions").update({ category: cat ?? FALLBACK }).eq("id", t.id);
  }
  console.log(`  categories: ${uncategorised.length} uncategorised → ${catFilled} from CSV, ${catFallback} → "${FALLBACK}"`);

  // ---- 2. link unlinked receipts to expense transactions -----------------
  const receipts = await fetchAll(
    "receipts",
    "id, vendor, amount, receipt_date, category",
  );
  const linkedReceiptIds = new Set(expenses.map((t) => t.receipt_id).filter(Boolean));
  const unlinkedReceipts = receipts.filter((r) => !linkedReceiptIds.has(r.id));

  // Index expense txns without a receipt by vendor+date for O(1) matching.
  const freeTxns = new Map(); // key -> [txn,...]
  for (const t of expenses) {
    if (t.receipt_id) continue;
    const key = `${t.txn_date}|${norm(t.description)}`;
    (freeTxns.get(key) ?? freeTxns.set(key, []).get(key)).push(t);
  }

  let linked = 0, noMatch = 0;
  for (const r of unlinkedReceipts) {
    const key = `${r.receipt_date}|${norm(r.vendor)}`;
    const bucket = freeTxns.get(key);
    const txn = bucket && bucket.shift();
    if (!txn) { noMatch++; continue; }
    linked++;
    if (APPLY) {
      await sb.from("transactions").update({ receipt_id: r.id }).eq("id", txn.id);
      // Copy real amount/category onto the receipt so it displays data.
      await sb.from("receipts").update({
        amount: r.amount && r.amount > 0 ? r.amount : txn.amount,
        category: r.category ?? txn.category,
      }).eq("id", r.id);
    }
  }
  console.log(`  receipts: ${receipts.length} total, ${unlinkedReceipts.length} unlinked → ${linked} newly linked, ${noMatch} no txn match`);
  console.log("Done.");
};

run().catch((e) => { console.error(e); process.exit(1); });
