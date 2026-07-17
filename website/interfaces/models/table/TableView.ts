import { SortDir } from "@utils/table";

export interface TableView {
  sort: string;
  dir: SortDir;
  page: number;
  /** Link that sorts by `key`, keeping the page's filters. */
  sortHref: (key: string) => string;
  /** Link to page `p`, keeping sort and filters. */
  pageHref: (p: number) => string;
  /**
   * The active sort + filters, for pages that build their own links (e.g. tab
   * bars) with mergeQuery — so those keep the sort too.
   */
  current: Record<string, string | undefined>;
}
