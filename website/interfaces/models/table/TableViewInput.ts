import { SortDir } from "@utils/table";

export interface TableViewInput {
  /** The list's own path, e.g. "/invoices". */
  basePath: string;
  params: { sort?: string; dir?: string; page?: string };
  /** Sortable column keys — anything else falls back to defaultSort. */
  sortKeys: string[];
  defaultSort: string;
  defaultDir?: SortDir;
  /** The page's active filters, carried through sort and page links. */
  filters?: Record<string, string | undefined>;
}
