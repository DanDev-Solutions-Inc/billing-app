import {
  parseSort,
  parseDir,
  parsePage,
  mergeQuery,
  nextDir,
} from "@utils/table";
import { TableView } from "@interfaces/models/table/TableView";
import { TableViewInput } from "@interfaces/models/table/TableViewInput";

/**
 * Read the sort/dir/page params and build the links that preserve them.
 *
 * Every list page repeated the same ~15 lines: parse three params, assemble a
 * `current` object of the page's own filters, then define sortHref/pageHref that
 * merge them. Each copy had to remember that a new sort invalidates the page,
 * and that page 1 should drop the param rather than write `?page=1`.
 *
 * `filters` is whatever that page narrows by (status, customer, q, period) —
 * it's carried through both links so sorting keeps the filter and vice versa.
 */
export const tableView = ({
  basePath,
  params,
  sortKeys,
  defaultSort,
  defaultDir = "desc",
  filters = {},
}: TableViewInput): TableView => {
  const sort = parseSort(params.sort, sortKeys, defaultSort);
  const dir = parseDir(params.dir, defaultDir);
  const page = parsePage(params.page);

  const current = { ...filters, sort, dir };

  return {
    sort,
    dir,
    page,
    current,
    sortHref: (key: string) =>
      mergeQuery(basePath, current, {
        sort: key,
        dir: nextDir(key, sort, dir),
        page: undefined, // a new order invalidates the current page
      }),
    pageHref: (p: number) =>
      mergeQuery(basePath, current, { page: p === 1 ? undefined : String(p) }),
  };
};
