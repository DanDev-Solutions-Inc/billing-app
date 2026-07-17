/**
 * Shared table plumbing: sorting, pagination, and query-string building.
 *
 * State lives in the URL (?sort=&dir=&page=) so a filtered/sorted view is
 * shareable, survives the back button, and needs no client JS.
 */

export type SortDir = "asc" | "desc";

export const PAGE_SIZE = 10;

/** A card grid fits more than a table row, and each card costs an image fetch. */
export const RECEIPT_PAGE_SIZE = 24;

/** Value a row sorts by, per column key. */
export type Accessors<T> = Record<string, (row: T) => string | number | null>;

export const parseDir = (value: string | undefined, fallback: SortDir = "desc"): SortDir =>
  value === "asc" || value === "desc" ? value : fallback;

export const parseSort = (
  value: string | undefined,
  allowed: readonly string[],
  fallback: string,
): string => (value && allowed.includes(value) ? value : fallback);

export const parsePage = (value: string | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
};

/**
 * Stable sort. Nulls always sink to the bottom regardless of direction —
 * a missing due date isn't "earliest", it's just absent.
 */
export const sortRows = <T>(
  rows: T[],
  key: string,
  dir: SortDir,
  accessors: Accessors<T>,
): T[] => {
  const get = accessors[key];
  if (!get) return rows;
  const factor = dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const av = get(a);
    const bv = get(b);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * factor;
    }
    return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor;
  });
};

export interface Page<T> {
  rows: T[];
  page: number;
  pages: number;
  total: number;
  /** 1-indexed display range, e.g. "26–50 of 548". */
  from: number;
  to: number;
}

export const paginate = <T>(
  rows: T[],
  page: number,
  pageSize = PAGE_SIZE,
): Page<T> => {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp so a stale ?page=99 shows the last page instead of an empty table.
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);
  return {
    rows: slice,
    page: current,
    pages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
};

/**
 * Merge patch params over the current ones. Empty/undefined values are dropped
 * so URLs stay clean (`/invoices` rather than `/invoices?status=&page=1`).
 */
export const mergeQuery = (
  basePath: string,
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
): string => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) {
    if (v !== undefined && v !== "") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
};

/** Next direction when a header is clicked: same column flips, new column starts desc. */
export const nextDir = (
  columnKey: string,
  activeKey: string,
  activeDir: SortDir,
): SortDir => (columnKey === activeKey && activeDir === "desc" ? "asc" : "desc");

/**
 * Describe a page that Postgres already sliced.
 *
 * `paginate` builds this from a full in-memory array; when the query does the
 * work, the rows and the total arrive separately and the display range has to
 * be derived. Same shape either way, so <Pagination> doesn't care which.
 */
export const pageOf = <T>(
  rows: T[],
  total: number,
  page: number,
  size = PAGE_SIZE,
): Page<T> => {
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page), pages);
  const from = total === 0 ? 0 : (current - 1) * size + 1;
  return { rows, page: current, pages, total, from, to: from + rows.length - 1 };
};
