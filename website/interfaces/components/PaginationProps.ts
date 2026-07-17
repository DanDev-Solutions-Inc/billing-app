export interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  from: number;
  to: number;
  /** Builds the href for a given page number. */
  hrefFor: (page: number) => string;
  /** Noun for the count, e.g. "26–50 of 548 invoices". */
  noun?: string;
  /**
   * `footer` — card footer (top border, card padding).
   * `bar`    — inline in a filter row, so the pager stays reachable without
   *            scrolling past the whole table on a short screen.
   */
  variant?: "footer" | "bar";
  className?: string;
}
