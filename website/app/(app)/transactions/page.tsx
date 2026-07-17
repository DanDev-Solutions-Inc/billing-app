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
  StatCard,
  FilterTabs,
  SortableHead,
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

export const metadata: Metadata = { title: "Transactions" };

const TYPES = ["review", "income", "expense"] as const;

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

  const supabase = await createClient();
  const everything = await listTransactions(supabase);
  const all = everything.filter((t) => inPeriod(t.txn_date, period));

  const income = all
    .filter((t) => t.direction === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = all
    .filter((t) => t.direction === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const pending = all.filter((t) => t.status === "pending").length;
  const rows =
    active === "all"
      ? all
      : active === "review"
        ? all.filter((t) => t.status === "pending")
        : all.filter((t) => t.direction === active);

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
    { key: "review", label: "To review", href: query("review", period), count: pending },
    {
      key: "income",
      label: "Income",
      href: query("income", period),
      count: all.filter((t) => t.direction === "income").length,
    },
    {
      key: "expense",
      label: "Expenses",
      href: query("expense", period),
      count: all.filter((t) => t.direction === "expense").length,
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

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Income" value={formatMoney(income)} tone="income" />
        <StatCard label="Expenses" value={formatMoney(expense)} tone="expense" />
        <StatCard
          label="Net"
          value={formatMoney(income - expense)}
          tone={income - expense >= 0 ? "income" : "expense"}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <FilterTabs tabs={typeTabs} active={active} aria-label="Filter by type" />
        <FilterTabs
          tabs={periodTabs}
          active={period}
          variant="segmented"
          aria-label="Filter by date range"
        />
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
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
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
          <Pagination {...result} hrefFor={pageHref} noun="transaction" />
        </Card>
      )}
    </>
  );
};

export default TransactionsPage;
