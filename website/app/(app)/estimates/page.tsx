import { Metadata } from "next";
import { FileText } from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listEstimates } from "@services/supabase/estimate";
import {
  PageHeader,
  Card,
  ButtonLink,
  StatusPill,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SortableHead,
  Pagination,
  FilterTabs, FilterBar, FilterGroup, RowLink } from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { parsePeriod, inPeriod, PERIOD_LABEL } from "@utils/period";
import {
  parseSort,
  parseDir,
  parsePage,
  sortRows,
  paginate,
  mergeQuery,
  nextDir,
  Accessors,
} from "@utils/table";
import { EstimateWithCustomer } from "@interfaces/models/estimate/EstimateWithCustomer";

export const metadata: Metadata = { title: "Estimates" };

const STATUSES = ["draft", "sent", "accepted", "declined"] as const;

/* What each sortable column sorts by. Dates sort as ISO strings (lexical ==
   chronological); money sorts numerically, not as text. */
const ACCESSORS: Accessors<EstimateWithCustomer> = {
  estimate_number: (e) => e.estimate_number ?? e.id,
  customer: (e) => e.customers?.name?.toLowerCase() ?? "",
  issue_date: (e) => e.issue_date,
  expiry_date: (e) => e.expiry_date,
  status: (e) => e.status,
  total: (e) => Number(e.total),
};
const SORT_KEYS = Object.keys(ACCESSORS);

const EstimatesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    period?: string;
    sort?: string;
    dir?: string;
    page?: string;
  }>;
}) => {
  await getUserOrRedirect();
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const status =
    params.status && STATUSES.includes(params.status as (typeof STATUSES)[number])
      ? params.status
      : "all";
  const sort = parseSort(params.sort, SORT_KEYS, "issue_date");
  const dir = parseDir(params.dir, "desc");
  const page = parsePage(params.page);

  const supabase = await createClient();
  const all = await listEstimates(supabase);

  const windowed = all.filter((e) => inPeriod(e.issue_date, period));
  const filtered =
    status === "all" ? windowed : windowed.filter((e) => e.status === status);
  const sorted = sortRows(filtered, sort, dir, ACCESSORS);
  const result = paginate(sorted, page);

  /* Current query, so sorting keeps the filters and vice versa. */
  const current = {
    status: status === "all" ? undefined : status,
    period: period === "month" ? undefined : period,
    sort,
    dir,
  };
  const sortHref = (key: string) =>
    mergeQuery("/estimates", current, {
      sort: key,
      dir: nextDir(key, sort, dir),
      page: undefined, // a new sort order invalidates the current page
    });
  const pageHref = (p: number) =>
    mergeQuery("/estimates", current, { page: p === 1 ? undefined : String(p) });
  const query = (nextStatus: string, nextPeriod: string) =>
    mergeQuery("/estimates", current, {
      status: nextStatus === "all" ? undefined : nextStatus,
      period: nextPeriod === "month" ? undefined : nextPeriod,
      page: undefined, // a new filter invalidates the current page
    });

  const statusTabs = [
    { key: "all", label: "All", href: query("all", period), count: windowed.length },
    ...STATUSES.map((s) => ({
      key: s,
      label: s[0].toUpperCase() + s.slice(1),
      href: query(s, period),
      count: windowed.filter((e) => e.status === s).length,
    })),
  ];

  const periodTabs = [
    { key: "month", label: "Month", href: query(status, "month") },
    { key: "year", label: "Year", href: query(status, "year") },
    { key: "all", label: "All time", href: query(status, "all") },
  ];

  return (
    <>
      <PageHeader
        title="Estimates"
        subtitle="Quote work before it becomes an invoice."
        action={
          <ButtonLink href="/estimates/new" size="sm">
            <FileText />
            New estimate
          </ButtonLink>
        }
      />

      {/* Pager sits with the filters so it's reachable without scrolling the
          whole table on a short screen. */}
      <FilterBar>
        <FilterGroup>
          <FilterTabs
            tabs={statusTabs}
            active={status}
            aria-label="Filter by status"
          />
          <FilterTabs
            tabs={periodTabs}
            active={period}
            variant="segmented"
            aria-label="Filter by date range"
          />
        </FilterGroup>
        {filtered.length > 0 && (
          <Pagination
            {...result}
            hrefFor={pageHref}
            noun="estimate"
            variant="bar"
          />
        )}
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          title={
            all.length === 0
              ? "No estimates yet"
              : "No estimates match these filters"
          }
          description={
            all.length === 0
              ? "Send a quote, then convert it to an invoice when accepted."
              : `Nothing ${status === "all" ? "" : `marked ${status} `}in ${PERIOD_LABEL[period].toLowerCase()}. Try a wider date range.`
          }
          action={
            all.length === 0 ? (
              <ButtonLink href="/estimates/new">
                <FileText />
                New estimate
              </ButtonLink>
            ) : (
              <ButtonLink href="/estimates?period=all" variant="secondary">
                View all time
              </ButtonLink>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableHead
                  label="Estimate"
                  sortKey="estimate_number"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("estimate_number")}
                />
                <SortableHead
                  label="Customer"
                  sortKey="customer"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("customer")}
                />
                <SortableHead
                  label="Issued"
                  sortKey="issue_date"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("issue_date")}
                />
                <SortableHead
                  label="Expires"
                  sortKey="expiry_date"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("expiry_date")}
                />
                <SortableHead
                  label="Status"
                  sortKey="status"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("status")}
                />
                <SortableHead
                  label="Total"
                  sortKey="total"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("total")}
                  align="right"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.map((est) => (
                <TableRow key={est.id}>
                  <TableCell className="font-medium">
                    {/* Opens from anywhere on the row — see RowLink. */}
                    <RowLink
                      href={`/estimates/${est.id}`}
                      className="text-brand-accent"
                    >
                      {est.estimate_number || `#${est.id.slice(0, 8)}`}
                    </RowLink>
                  </TableCell>
                  <TableCell>{est.customers?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(est.issue_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(est.expiry_date)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={est.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(est.total, est.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
};

export default EstimatesPage;
