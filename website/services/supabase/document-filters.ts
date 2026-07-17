import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";

export interface DocumentFilters {
  /** Free text: document number, notes, or customer name. */
  search?: string;
  customerId?: string;
  /** yyyy-mm-dd, inclusive. */
  from?: string;
  to?: string;
}

/** PostgREST's or() is comma/paren-delimited, so those can't appear in a term. */
const clean = (s: string) => s.trim().replace(/[,()]/g, " ");

/**
 * Build the or() clause for free-text search over an invoice/estimate list.
 *
 * Returns the clause rather than a query, deliberately: a PostgrestFilterBuilder
 * is thenable, so handing one back from an async function would make `await`
 * run the query instead of passing the builder on.
 *
 * Customer name lives on a joined table, and an embedded `customers.name=ilike`
 * filter inner-joins — silently dropping every document with no customer. So
 * matching customers are resolved first and folded in by id, which keeps
 * unassigned documents searchable.
 */
export const documentSearchClause = async (
  sb: SupabaseClient,
  search: string | undefined,
  numberColumn: "invoice_number" | "estimate_number" = "invoice_number",
): Promise<string | null> => {
  const q = clean(search ?? "");
  if (!q) return null;

  const { data: matches } = await sb
    .from("customers")
    .select("id")
    .ilike("name", `%${q}%`);
  const ids = (matches ?? []).map((c) => c.id);

  const clauses = [`${numberColumn}.ilike.%${q}%`, `notes.ilike.%${q}%`];
  if (ids.length) clauses.push(`customer_id.in.(${ids.join(",")})`);
  return clauses.join(",");
};
