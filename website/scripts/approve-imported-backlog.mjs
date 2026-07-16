// One-off: clear the review backlog. Every transaction that exists *now* is
// historical (Wave import, receipt import, AI extraction) and has already been
// reconciled in Wave — so mark it approved. From here on only NEW receipts and
// uploads land in "To review".
//
// Reversible: `update transactions set status='pending' where ...` (but note it
// cannot distinguish these rows afterwards, so check the dry run first).
//
//   cd website && set -a; source .env.local; set +a
//   WAVE_IMPORT_USER_ID=<uuid> node scripts/approve-imported-backlog.mjs         # dry run
//   WAVE_IMPORT_USER_ID=<uuid> APPLY=1 node scripts/approve-imported-backlog.mjs # write
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID } = process.env;
const APPLY = process.env.APPLY === "1";
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WAVE_IMPORT_USER_ID) {
  console.error("Missing env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID)");
  process.exit(1);
}
const userId = WAVE_IMPORT_USER_ID;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Only approve rows that already exist — anything created after this cutoff is
// genuinely new and should still be reviewed.
const CUTOFF = process.env.CUTOFF ?? new Date().toISOString();

const run = async () => {
  console.log(APPLY ? "APPLY mode — writing." : "DRY RUN — no writes. Set APPLY=1 to write.");
  console.log(`  cutoff (created_at <=): ${CUTOFF}`);

  const { count: pending } = await sb.from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId).eq("status", "pending").lte("created_at", CUTOFF);
  console.log(`  ${pending} pending transactions would be approved`);

  if (!APPLY) return console.log("Done (dry run).");

  const { error } = await sb.from("transactions")
    .update({ status: "approved" })
    .eq("user_id", userId).eq("status", "pending").lte("created_at", CUTOFF);
  if (error) return console.error(`  error: ${error.message}`);

  const { count: left } = await sb.from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId).eq("status", "pending");
  const { count: approved } = await sb.from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId).eq("status", "approved");
  console.log(`  now: ${approved} approved, ${left} pending`);
  console.log("Done.");
};

run().catch((e) => { console.error(e); process.exit(1); });
