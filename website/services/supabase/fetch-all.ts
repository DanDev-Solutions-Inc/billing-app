import "server-only";

/** PostgREST's default `db-max-rows`. A plain select() silently stops here. */
export const POSTGREST_MAX_ROWS = 1000;

/**
 * Fetch every row of a query, paging past PostgREST's 1,000-row cap.
 *
 * A bare `.select()` does not error when it hits the cap — it just returns the
 * first 1,000 rows. With 4,693 transactions that meant the ledger silently
 * showed the newest 1,000 and under-reported all-time income by ~$930k.
 *
 * `build` is called per page so each request gets a fresh builder (a
 * PostgrestFilterBuilder can only be awaited once). Ordering must be stable or
 * pages can repeat/skip rows — every caller already orders by a date plus
 * created_at as a tiebreak.
 *
 * This is a correctness backstop, not a licence to fetch everything: prefer
 * pushing filters, aggregation and pagination into Postgres where the page can.
 */
export const fetchAllRows = async <T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> => {
  const out: T[] = [];
  for (let from = 0; ; from += POSTGREST_MAX_ROWS) {
    const { data } = await build(from, from + POSTGREST_MAX_ROWS - 1);
    if (!data?.length) break;
    out.push(...data);
    // A short page means the end; a full one might not, so ask again.
    if (data.length < POSTGREST_MAX_ROWS) break;
  }
  return out;
};
