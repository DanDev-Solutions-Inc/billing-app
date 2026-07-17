import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import {
  listTransactions,
  countTransactions,
} from "@services/supabase/transaction";
import { FileText, Receipt as ReceiptIcon, Plus } from "lucide-react";
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
  TableHead,
  TableCell,
  FilterTabs,
  SearchInput,
  ClearFilters,
  SortableHead,
  Checkbox,
  Pagination, FilterBar, RowLink, RowAction, ConfirmButton } from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { parsePeriod, periodStartIso, PERIOD_LABEL } from "@utils/period";
import { pageOf, mergeQuery } from "@utils/table";
import { tableView } from "@utils/table/table-view";
import { deleteTransactionAction } from "./actions";
import { BulkForm } from "@components/transactions/bulk-form";

export const metadata: Metadata = { title: "Transactions" };

const TYPES = ["review", "reviewed"] as const;

/* Sortable columns. These are real columns, so Postgres orders by them —
   there's no accessor map because nothing is sorted in JS. */
const SORT_COLUMNS = ["txn_date", "description", "category", "amount"];


const TransactionsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    period?: string;
    q?: string;
    sort?: string;
    dir?: string;
    page?: string;
  }>;
}) => {
  await getUserOrRedirect();
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const active = TYPES.includes(params.type as (typeof TYPES)[number])
    ? (params.type as string)
    : "all";
  const q = params.q?.trim() ?? "";

  const { sort, dir, page, sortHref, pageHref, current } = tableView({
    basePath: "/transactions",
    params,
    sortKeys: SORT_COLUMNS,
    defaultSort: "txn_date",
    /* Defaults are dropped so the plain /transactions URL stays clean. */
    filters: {
      type: active === "all" ? undefined : active,
      period: period === "month" ? undefined : period,
      q: q || undefined,
    },
  });

  const supabase = await createClient();

  /* Everything the list narrows by is a stored column, so Postgres does all of
     it — filter, sort, and page. This used to fetch every transaction and do
     the work in JS, which meant 4,693 rows over the wire to render 10, and the
     newest 1,000 only (PostgREST truncates at that, silently). */
  const from = periodStartIso(period);
  const status =
    active === "review" ? "pending" : active === "reviewed" ? "approved" : undefined;

  const [result, totalCount, pending] = await Promise.all([
    listTransactions(supabase, { status, from, search: q, sort, dir, page }),
    // The tabs count what matches the *window*, independent of the active tab.
    countTransactions(supabase, { from, search: q }),
    countTransactions(supabase, { from, search: q, status: "pending" }),
  ]);
  const rows = result.rows;
  const paged = pageOf(rows, result.total, page);

  /* A ?page= past the end (stale bookmark, or the list shrank) queried an empty
     range and would render "no matches" over a non-empty list. Bounce to the
     real last page so the URL self-corrects. Outside any try/catch — redirect()
     throws NEXT_REDIRECT by design. */
  if (page > paged.pages) redirect(pageHref(paged.pages));

  /* Any narrowing at all — an empty result then means "no matches", not "no
     transactions". */
  const isFiltered = Boolean(q || active !== "all" || period !== "month");

  /* Switching a filter keeps the sort but not the page — the row you were
     looking at almost certainly isn't on page 3 of the new list. */
  const query = (type: string, p: string) =>
    mergeQuery("/transactions", current, {
      type: type === "all" ? undefined : type,
      period: p === "month" ? undefined : p,
      page: undefined,
    });

  const typeTabs = [
    { key: "all", label: "All", href: query("all", period), count: totalCount },
    {
      key: "review",
      label: "To review",
      href: query("review", period),
      count: pending,
    },
    {
      key: "reviewed",
      label: "Reviewed",
      href: query("reviewed", period),
      count: totalCount - pending,
    },
  ];

  const periodTabs = [
    { key: "month", label: "Month", href: query(active, "month") },
    { key: "year", label: "Year", href: query(active, "year") },
    { key: "all", label: "All time", href: query(active, "all") },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Money in and out of your business."
        action={
          <ButtonLink href="/transactions/new" size="sm">
            <Plus />
            New transaction
          </ButtonLink>
        }
      />

      {/* Pager sits with the filters so it's reachable without scrolling the
          whole table on a short screen. */}
      <FilterBar>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search description, category…"
            className="w-full sm:max-w-xs"
          />
          <FilterTabs tabs={typeTabs} active={active} aria-label="Filter by review state" />
          <FilterTabs
            tabs={periodTabs}
            active={period}
            variant="segmented"
            aria-label="Filter by date range"
          />
          <ClearFilters
            href="/transactions"
            active={Boolean(q || active !== "all" || period !== "month")}
          />
        </div>
        {rows.length > 0 && (
          <Pagination
            {...paged}
            hrefFor={pageHref}
            noun="transaction"
            variant="bar"
          />
        )}
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState
          /* `isFiltered` rather than a total-rows count: with the list paged
             in Postgres we no longer hold every row, and asking for a bare
             count purely to word an empty state isn't worth the round trip. */
          title={isFiltered ? "No transactions match these filters" : "No transactions yet"}
          description={
            isFiltered
              ? `Nothing in ${PERIOD_LABEL[period].toLowerCase()}. Try a wider date range.`
              : "Paid invoices and receipt expenses show up here automatically, or add one manually."
          }
          action={
            !isFiltered ? (
              <ButtonLink href="/transactions/new" size="sm">
            <Plus />
            New transaction
          </ButtonLink>
            ) : (
              <ButtonLink href="/transactions?period=all" variant="secondary">
                View all time
              </ButtonLink>
            )
          }
        />
      ) : (
        <BulkForm>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[44px]">
                  <Checkbox
                    data-select-all=""
                    aria-label="Select all on this page"
                  />
                </TableHead>
                <SortableHead
                  label="Date"
                  sortKey="txn_date"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("txn_date")}
                  className="hidden w-[110px] sm:table-cell"
                />
                {/* w-full makes Description absorb slack so Amount never clips */}
                <SortableHead
                  label="Description"
                  sortKey="description"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("description")}
                  className="w-full"
                />
                <SortableHead
                  label="Category"
                  sortKey="category"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("category")}
                  className="hidden md:table-cell"
                />
                {/* Status column only earns its width when something needs review */}
                {pending > 0 && <TableHead className="w-[90px]">Status</TableHead>}
                <SortableHead
                  label="Amount"
                  sortKey="amount"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("amount")}
                  align="right"
                />
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.map((t) => {
                /* Source link becomes a quiet icon — the description already
                   names the vendor, so repeating it was pure noise. */
                const source = t.invoice_id
                  ? {
                      href: `/invoices/${t.invoice_id}`,
                      title: `Invoice ${t.invoices?.invoice_number ?? ""}`.trim(),
                      Icon: FileText,
                    }
                  : t.receipt_id
                    ? {
                        href: `/receipts/${t.receipt_id}`,
                        title: t.receipts?.vendor
                          ? `Receipt · ${t.receipts.vendor}`
                          : "Receipt",
                        Icon: ReceiptIcon,
                      }
                    : null;
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <RowAction>
                        <Checkbox
                          name="ids"
                          value={t.id}
                          aria-label={`Select ${t.description || "transaction"}`}
                        />
                      </RowAction>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(t.txn_date)}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="flex items-center gap-2">
                        <RowLink
                          href={`/transactions/${t.id}`}
                          className="truncate"
                        >
                          {t.description || "View transaction"}
                        </RowLink>
                      </div>
                      {/* Date and category ride under the description on
                          mobile — as columns they ate the width the
                          description needed, truncating it to "Wave Fin…". */}
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:hidden">
                        {[formatDate(t.txn_date), t.category]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block md:hidden">
                        {t.category}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {t.category || "—"}
                    </TableCell>
                    {pending > 0 && (
                      <TableCell>
                        {t.status === "pending" ? (
                          <StatusPill status={t.status} />
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell
                      className={
                        "text-right font-medium tabular-nums " +
                        (t.direction === "income"
                          ? "text-brand-green"
                          : "text-brand-red")
                      }
                    >
                      {t.direction === "income" ? "+" : "−"}
                      {formatMoney(t.amount)}
                    </TableCell>
                    <TableCell>
                      {/* No Edit icon: the whole row opens the transaction
                          (see RowLink). RowAction lifts delete above the row
                          overlay — without it the overlay swallows the click. */}
                      <RowAction className="justify-end gap-1">
                        {/* The source document lives with the other row
                            actions rather than glued to the description —
                            it's an action, not part of the label. */}
                        {source && (
                          <ButtonLink
                            href={source.href}
                            variant="ghost"
                            size="icon"
                            title={source.title}
                            aria-label={source.title}
                          >
                            <source.Icon />
                          </ButtonLink>
                        )}
                        {/* standalone={false}: this row is inside the
                            bulk-select form, and a nested <form> is invalid —
                            the parser drops the inner one, so it would submit
                            the bulk form instead of deleting. */}
                        <ConfirmButton
                          action={deleteTransactionAction}
                          id={t.id}
                          standalone={false}
                          title="Delete this transaction?"
                          description="Its receipt and stored file go too — the receipt only exists as this transaction's source document."
                          triggerLabel={`Delete ${t.description || "transaction"}`}
                        />
                      </RowAction>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        </BulkForm>
      )}
    </>
  );
};

export default TransactionsPage;
