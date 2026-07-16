import "server-only";
import { waveGraphql } from "@lib/wave/client";
import { SupabaseClient } from "@typings/SupabaseClient";
import { upsertCustomerByWaveId } from "@services/supabase/customer";
import {
  upsertInvoiceByWaveId,
} from "@services/supabase/invoice";
import { upsertEstimateByWaveId } from "@services/supabase/estimate";
import { createLineItems, deleteLineItems } from "@services/supabase/line-item";
import {
  createTransaction,
  hasInvoiceIncome,
} from "@services/supabase/transaction";
import {
  parseWaveMoney,
  mapInvoiceStatus,
  mapEstimateStatus,
  buildAddress,
  waveContactName,
} from "@utils/wave-map";
import { WaveCustomerNode } from "@interfaces/models/wave/WaveCustomerNode";
import { WaveInvoiceNode } from "@interfaces/models/wave/WaveInvoiceNode";
import { WaveEstimateNode } from "@interfaces/models/wave/WaveEstimateNode";
import { WaveImportSummary } from "@interfaces/models/wave/WaveImportSummary";

const PAGE_SIZE = 100;

interface PageInfo {
  currentPage: number;
  totalPages: number;
}
interface Edge<T> {
  node: T;
}
interface Connection<T> {
  pageInfo: PageInfo;
  edges: Edge<T>[];
}

const CUSTOMERS_QUERY = `query($id:ID!,$page:Int!,$size:Int!){
  business(id:$id){ name customers(page:$page,pageSize:$size){
    pageInfo{ currentPage totalPages }
    edges{ node{ id name firstName lastName email mobile phone
      address{ addressLine1 addressLine2 city postalCode province{name} country{name} } } } } } }`;

const INVOICES_QUERY = `query($id:ID!,$page:Int!,$size:Int!){
  business(id:$id){ invoices(page:$page,pageSize:$size){
    pageInfo{ currentPage totalPages }
    edges{ node{ id invoiceNumber status invoiceDate dueDate memo
      subtotal{value} taxTotal{value} total{value} amountDue{value}
      customer{ id } items{ description quantity price total{value} } } } } } }`;

const ESTIMATES_QUERY = `query($id:ID!,$page:Int!,$size:Int!){
  business(id:$id){ estimates(page:$page,pageSize:$size){
    pageInfo{ currentPage totalPages }
    edges{ node{ id estimateNumber status estimateDate memo
      subtotal{value} taxTotal{value} total{value}
      customer{ id } items{ description quantity unitPrice total{value} } } } } } }`;

/** Fetch every page of a business connection and return the flattened nodes. */
const fetchAll = async <T>(
  token: string,
  businessId: string,
  query: string,
  pick: (business: Record<string, Connection<T>>) => Connection<T>,
): Promise<T[]> => {
  const nodes: T[] = [];
  let page = 1;
  for (;;) {
    const data = await waveGraphql<{
      business: Record<string, Connection<T>>;
    }>(token, query, { id: businessId, page, size: PAGE_SIZE });
    const conn = pick(data.business);
    nodes.push(...conn.edges.map((e) => e.node));
    if (page >= conn.pageInfo.totalPages || conn.edges.length === 0) break;
    page += 1;
  }
  return nodes;
};

/** Import all customers, invoices, and estimates for a Wave business. */
export const importWaveBusiness = async (
  sb: SupabaseClient,
  userId: string,
  token: string,
  businessId: string,
): Promise<WaveImportSummary> => {
  // Business name (for the summary).
  const meta = await waveGraphql<{ business: { name: string } }>(
    token,
    `query($id:ID!){ business(id:$id){ name } }`,
    { id: businessId },
  );

  // --- Customers ---
  const waveCustomers = await fetchAll<WaveCustomerNode>(
    token,
    businessId,
    CUSTOMERS_QUERY,
    (b) => b.customers,
  );

  const customerIdMap = new Map<string, string>(); // wave id → local id
  for (const c of waveCustomers) {
    const { id } = await upsertCustomerByWaveId(sb, {
      user_id: userId,
      wave_id: c.id,
      name: waveContactName(c),
      email: c.email,
      phone: c.phone ?? c.mobile,
      address: buildAddress(c.address),
    });
    if (id) customerIdMap.set(c.id, id);
  }

  // --- Invoices (+ line items, + income transactions for paid) ---
  const waveInvoices = await fetchAll<WaveInvoiceNode>(
    token,
    businessId,
    INVOICES_QUERY,
    (b) => b.invoices,
  );

  let invoiceCount = 0;
  for (const inv of waveInvoices) {
    const status = mapInvoiceStatus(inv.status);
    const { id: invoiceId } = await upsertInvoiceByWaveId(sb, {
      user_id: userId,
      wave_id: inv.id,
      customer_id: inv.customer ? (customerIdMap.get(inv.customer.id) ?? null) : null,
      invoice_number: inv.invoiceNumber,
      status,
      issue_date: inv.invoiceDate ?? undefined,
      due_date: inv.dueDate,
      notes: inv.memo,
      subtotal: parseWaveMoney(inv.subtotal),
      tax: parseWaveMoney(inv.taxTotal),
      total: parseWaveMoney(inv.total),
    });
    if (!invoiceId) continue;
    invoiceCount += 1;

    // Replace line items (idempotent re-sync).
    await deleteLineItems(sb, "invoice", invoiceId);
    if (inv.items.length) {
      await createLineItems(sb, {
        userId,
        parentType: "invoice",
        parentId: invoiceId,
        items: inv.items.map((it) => ({
          description: it.description ?? "",
          quantity: parseWaveMoney(it.quantity),
          unit_price: parseWaveMoney(it.price),
        })),
      });
    }

    // Paid invoices become an income transaction (once).
    if (status === "paid" && !(await hasInvoiceIncome(sb, invoiceId))) {
      await createTransaction(sb, {
        user_id: userId,
        txn_date: inv.invoiceDate ?? new Date().toISOString().slice(0, 10),
        description: `Invoice ${inv.invoiceNumber ?? ""} paid`.trim(),
        amount: parseWaveMoney(inv.total),
        direction: "income",
        category: "Sales",
        invoice_id: invoiceId,
      });
    }
  }

  // --- Estimates (+ line items) ---
  const waveEstimates = await fetchAll<WaveEstimateNode>(
    token,
    businessId,
    ESTIMATES_QUERY,
    (b) => b.estimates,
  );

  let estimateCount = 0;
  for (const est of waveEstimates) {
    const { id: estimateId } = await upsertEstimateByWaveId(sb, {
      user_id: userId,
      wave_id: est.id,
      customer_id: est.customer ? (customerIdMap.get(est.customer.id) ?? null) : null,
      estimate_number: est.estimateNumber,
      status: mapEstimateStatus(est.status),
      issue_date: est.estimateDate ?? undefined,
      notes: est.memo,
      subtotal: parseWaveMoney(est.subtotal),
      tax: parseWaveMoney(est.taxTotal),
      total: parseWaveMoney(est.total),
    });
    if (!estimateId) continue;
    estimateCount += 1;

    await deleteLineItems(sb, "estimate", estimateId);
    if (est.items.length) {
      await createLineItems(sb, {
        userId,
        parentType: "estimate",
        parentId: estimateId,
        items: est.items.map((it) => ({
          description: it.description ?? "",
          quantity: parseWaveMoney(it.quantity),
          unit_price: parseWaveMoney(it.unitPrice),
        })),
      });
    }
  }

  const paidCount = waveInvoices.filter(
    (i) => mapInvoiceStatus(i.status) === "paid",
  ).length;

  return {
    businessName: meta.business.name,
    customers: customerIdMap.size,
    invoices: invoiceCount,
    estimates: estimateCount,
    transactions: paidCount,
  };
};
