import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listTransactions } from "@services/supabase/transaction";
import { FileText, Receipt as ReceiptIcon, Trash2, Plus } from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
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
  Pagination,
} from "@components/ui";
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
import { TransactionWithLinks } from "@interfaces/models/transaction/TransactionWithLinks";
import { deleteTransactionAction } from "./actions";
import { BulkForm } from "@components/transactions/bulk-form";

export const metadata: Metadata = { title: "Transactions" };

const TYPES = ["review", "reviewed"] as const;

/* What each sortable column sorts by. Dates sort as ISO strings (lexical ==
   chronological); amount sorts numerically by magnitude — the +/− shown in the
   cell is direction, not sign, so signing it here would interleave the two
   halves of a mixed list rather than rank it by size. */
const ACCESSORS: Accessors<TransactionWithLinks> = {
  txn_date: (t) => t.txn_date,
  description: (t) => t.description?.toLowerCase() ?? "",
  category: (t) => t.category?.toLowerCase() ?? "",
  amount: (t) => Number(t.amount),
};
const SORT_KEYS = Object.keys(ACCESSORS);

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
  const sort = parseSort(params.sort, SORT_KEYS, "txn_date");
  const dir = parseDir(params.dir, "desc");
  const page = parsePage(params.page);
  const q = params.q?.trim() ?? "";

  const supabase = await createClient();
  /* Search runs in Postgres so it reaches every transaction, not just the page.
     Period/type stay client-side filters over the result. */
  const everything = await listTransactions(supabase, undefined, q);
  const all = everything.filter((t) => inPeriod(t.txn_date, period));

  const pending = all.filter((t) => t.status === "pending").length;
  const rows =
    active === "all"
      ? all
      : active === "review"
        ? all.filter((t) => t.status === "pending")
        : all.filter((t) => t.status === "approved");

  const sorted = sortRows(rows, sort, dir, ACCESSORS);
  const result = paginate(sorted, page);

  /* Current query, so sorting keeps the filters and vice versa. Defaults are
     dropped so the plain /transactions URL stays clean. */
  const current = {
    type: active === "all" ? undefined : active,
    period: period === "month" ? undefined : period,
    sort,
    dir,
  };
  /* Switching a filter keeps the sort but not the page — the row you were
     looking at almost certainly isn't on page 3 of the new list. */
  const query = (type: string, p: string) =>
    mergeQuery("/transactions", current, {
      type: type === "all" ? undefined : type,
      period: p === "month" ? undefined : p,
      page: undefined,
    });
  const sortHref = (key: string) =>
    mergeQuery("/transactions", current, {
      sort: key,
      dir: nextDir(key, sort, dir),
      page: undefined, // a new sort order invalidates the current page
    });
  const pageHref = (p: number) =>
    mergeQuery("/transactions", current, {
      page: p === 1 ? undefined : String(p),
    });

  const typeTabs = [
    { key: "all", label: "All", href: query("all", period), count: all.length },
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
      count: all.length - pending,
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
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
            {...result}
            hrefFor={pageHref}
            noun="transaction"
            variant="bar"
          />
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={
            everything.length === 0
              ? "No transactions yet"
              : "No transactions match these filters"
          }
          description={
            everything.length === 0
              ? "Paid invoices and receipt expenses show up here automatically, or add one manually."
              : `Nothing in ${PERIOD_LABEL[period].toLowerCase()}. Try a wider date range.`
          }
          action={
            everything.length === 0 ? (
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
                  className="w-[110px]"
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
                      <Checkbox
                        name="ids"
                        value={t.id}
                        aria-label={`Select ${t.description || "transaction"}`}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(t.txn_date)}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/transactions/${t.id}`}
                          className="truncate font-medium text-foreground transition-colors hover:text-brand-accent"
                        >
                          {t.description || "View transaction"}
                        </Link>
                        {source && (
                          <Link
                            href={source.href}
                            title={source.title}
                            aria-label={source.title}
                            className="shrink-0 text-muted-foreground transition-colors hover:text-brand-accent"
                          >
                            <source.Icon className="size-3.5" />
                          </Link>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground md:hidden">
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
                    <TableCell className="text-right">
                      <form action={deleteTransactionAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <Button
                          type="submit"
                          variant="dangerGhost"
                          size="icon"
                          title="Delete transaction"
                          aria-label="Delete transaction"
                        >
                          <Trash2 />
                        </Button>
                      </form>
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
