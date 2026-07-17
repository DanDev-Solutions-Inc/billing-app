// Set exchange_rate on USD documents from the Bank of Canada's official
// USD/CAD daily rate for each document's issue date.
//
// Per-document rather than one flat rate: these span 2021–2026, when USD/CAD
// moved from ~1.25 to ~1.37. Using today's rate would misstate 2021 revenue by
// ~10%. The BoC series is the rate CRA accepts, and it's what the invoice was
// really worth in CAD on the day it was raised.
//
// Rates don't publish on weekends/holidays, so the nearest preceding business
// day is used — the same convention BoC's own lookup applies.
//
//   cd website && set -a; source .env.local; set +a
//   WAVE_IMPORT_USER_ID=<uuid> node scripts/backfill-exchange-rates.mjs         # dry run
//   WAVE_IMPORT_USER_ID=<uuid> APPLY=1 node scripts/backfill-exchange-rates.mjs # write
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID } = process.env;
const APPLY = process.env.APPLY === "1";
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WAVE_IMPORT_USER_ID) {
  console.error("Missing env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WAVE_IMPORT_USER_ID)");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const VALET = "https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json";

/** Official USD→CAD for a date, falling back to the last business day before it. */
const rateOn = async (date) => {
  // Ten days back is enough to clear any weekend or holiday run.
  const from = new Date(`${date}T00:00:00`);
  from.setDate(from.getDate() - 10);
  const start = from.toISOString().slice(0, 10);

  const res = await fetch(`${VALET}?start_date=${start}&end_date=${date}`);
  if (!res.ok) return null;
  const json = await res.json();
  const obs = json.observations ?? [];
  if (!obs.length) return null;

  const last = obs[obs.length - 1];
  return { rate: Number(last.FXUSDCAD?.v), on: last.d };
};

const run = async () => {
  console.log(APPLY ? "APPLY mode — writing." : "DRY RUN — no writes. Set APPLY=1 to write.");

  const { data: invoices } = await sb
    .from("invoices")
    .select("id, invoice_number, issue_date, total, currency, exchange_rate")
    .eq("user_id", WAVE_IMPORT_USER_ID)
    .eq("currency", "USD")
    .order("issue_date");

  if (!invoices?.length) return console.log("No USD invoices.");

  let cadTotal = 0;
  for (const inv of invoices) {
    const found = await rateOn(inv.issue_date);
    if (!found?.rate) {
      console.log(`  ! ${inv.invoice_number}: no rate for ${inv.issue_date}`);
      continue;
    }
    const cad = Number(inv.total) * found.rate;
    cadTotal += cad;
    const note = found.on === inv.issue_date ? "" : ` (rate from ${found.on})`;
    console.log(
      `  ${inv.invoice_number}  ${inv.issue_date}  $${inv.total} USD × ${found.rate} = $${cad.toFixed(2)} CAD${note}`,
    );
    if (APPLY)
      await sb.from("invoices").update({ exchange_rate: found.rate }).eq("id", inv.id);
  }

  const usdTotal = invoices.reduce((s, i) => s + Number(i.total), 0);
  console.log(`\n  ${invoices.length} USD invoices: $${usdTotal.toFixed(2)} USD = $${cadTotal.toFixed(2)} CAD`);
  console.log("Done.");
};

run().catch((e) => { console.error(e); process.exit(1); });
