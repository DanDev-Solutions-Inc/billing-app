// One-off Wave → Supabase importer (mirrors services/wave/import-wave-business.ts).
// Seeds/verifies data now; the app's "Sync from Wave" button uses the same logic.
//   set -a; source .env.local; set +a
//   WAVE_IMPORT_USER_ID=<uuid> node scripts/wave-import.mjs
import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  WAVE_FULL_ACCESS_TOKEN,
  WAVE_BUSINESS_ID,
  WAVE_IMPORT_USER_ID,
} = process.env;

const userId = WAVE_IMPORT_USER_ID;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WAVE_FULL_ACCESS_TOKEN || !WAVE_BUSINESS_ID || !userId) {
  console.error("Missing env (supabase url/key, wave token/business id, WAVE_IMPORT_USER_ID)");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const gql = async (query, variables) => {
  const res = await fetch("https://gql.waveapps.com/graphql/public", {
    method: "POST",
    headers: { Authorization: `Bearer ${WAVE_FULL_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
};

const money = (m) => {
  const raw = typeof m === "string" ? m : (m?.value ?? "0");
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const invStatus = (s) => {
  const u = (s || "").toUpperCase();
  if (u === "PAID") return "paid";
  if (u === "DRAFT" || u === "SAVED") return "draft";
  return "sent";
};
const address = (a) => {
  if (!a) return null;
  const lines = [a.addressLine1, a.addressLine2, [a.city, a.province?.name, a.postalCode].filter(Boolean).join(", "), a.country?.name].filter((l) => l && l.trim());
  return lines.length ? lines.join("\n") : null;
};

const fetchAll = async (query, pick) => {
  const nodes = [];
  let page = 1;
  for (;;) {
    const data = await gql(query, { id: WAVE_BUSINESS_ID, page, size: 100 });
    const conn = pick(data.business);
    nodes.push(...conn.edges.map((e) => e.node));
    if (page >= conn.pageInfo.totalPages || conn.edges.length === 0) break;
    page++;
  }
  return nodes;
};

const CUSTOMERS = `query($id:ID!,$page:Int!,$size:Int!){ business(id:$id){ customers(page:$page,pageSize:$size){ pageInfo{totalPages} edges{ node{ id name firstName lastName email mobile phone address{ addressLine1 addressLine2 city postalCode province{name} country{name} } } } } } }`;
const INVOICES = `query($id:ID!,$page:Int!,$size:Int!){ business(id:$id){ invoices(page:$page,pageSize:$size){ pageInfo{totalPages} edges{ node{ id invoiceNumber status invoiceDate dueDate memo subtotal{value} taxTotal{value} total{value} customer{id} items{ description quantity price total{value} } } } } } }`;

// Manual upsert by (user_id, wave_id) — avoids ON CONFLICT inference against a
// partial unique index (which supabase-js can't target).
const upsertByWave = async (table, waveId, values) => {
  const { data: existing } = await sb.from(table).select("id")
    .eq("user_id", userId).eq("wave_id", waveId).maybeSingle();
  if (existing) {
    await sb.from(table).update(values).eq("id", existing.id);
    return existing.id;
  }
  const { data, error } = await sb.from(table).insert(values).select("id").single();
  if (error) console.error(`${table} insert error:`, error.message);
  return data?.id;
};

const run = async () => {
  console.log("Fetching customers…");
  const customers = await fetchAll(CUSTOMERS, (b) => b.customers);
  const map = new Map();
  for (const c of customers) {
    const id = await upsertByWave("customers", c.id, {
      user_id: userId, wave_id: c.id,
      name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || "Customer",
      email: c.email, phone: c.phone ?? c.mobile, address: address(c.address),
    });
    if (id) map.set(c.id, id);
  }
  console.log(`  ${map.size} customers upserted`);

  console.log("Fetching invoices…");
  const invoices = await fetchAll(INVOICES, (b) => b.invoices);
  let paid = 0;
  let n = 0;
  for (const inv of invoices) {
    const status = invStatus(inv.status);
    const invoiceId = await upsertByWave("invoices", inv.id, {
      user_id: userId, wave_id: inv.id,
      customer_id: inv.customer ? (map.get(inv.customer.id) ?? null) : null,
      invoice_number: inv.invoiceNumber, status,
      issue_date: inv.invoiceDate ?? undefined, due_date: inv.dueDate, notes: inv.memo,
      subtotal: money(inv.subtotal), tax: money(inv.taxTotal), total: money(inv.total),
    });
    if (!invoiceId) continue;
    n++;
    await sb.from("line_items").delete().eq("parent_type", "invoice").eq("parent_id", invoiceId);
    if (inv.items?.length) {
      await sb.from("line_items").insert(inv.items.map((it, i) => ({
        user_id: userId, parent_type: "invoice", parent_id: invoiceId,
        description: it.description ?? "", quantity: money(it.quantity), unit_price: money(it.price), position: i,
      })));
    }
    if (status === "paid") {
      const { data: existing } = await sb.from("transactions").select("id").eq("invoice_id", invoiceId).eq("direction", "income").maybeSingle();
      if (!existing) {
        await sb.from("transactions").insert({
          user_id: userId, txn_date: inv.invoiceDate ?? new Date().toISOString().slice(0, 10),
          description: `Invoice ${inv.invoiceNumber ?? ""} paid`.trim(), amount: money(inv.total),
          direction: "income", category: "Sales", invoice_id: invoiceId,
        });
        paid++;
      }
    }
    if (n % 100 === 0) console.log(`  ${n}/${invoices.length} invoices…`);
  }
  console.log(`  ${n} invoices upserted, ${paid} income transactions`);
  console.log("Done.");
};

run().catch((e) => { console.error(e); process.exit(1); });
