import { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listInvoices } from "@services/supabase/invoice";
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
  FilterSelect,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { isOverdue } from "@utils/invoice";
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
import { InvoiceWithCustomer } from "@interfaces/models/invoice/InvoiceWithCustomer";

export const metadata: Metadata = { title: "Invoices" };

/* Invoices are a working list, not a time report: no date window here — an
   unpaid invoice matters regardless of when it was issued.

   "overdue" is a derived view (sent + past due_date), not a stored status —
   `invoice_status` is only draft | sent | paid. */
const STATUSES = ["sent", "paid", "overdue"] as const;

const matchesStatus = (
  inv: { status: string; due_date: string | null },
  status: string,
) => (status === "overdue" ? isOverdue(inv) : inv.status === status);

/* What each sortable column sorts by. Dates sort as ISO strings (lexical ==
   chronological); money sorts numerically, not as text. */
const ACCESSORS: Accessors<InvoiceWithCustomer> = {
  invoice_number: (i) => i.invoice_number ?? i.id,
  customer: (i) => i.customers?.name?.toLowerCase() ?? "",
  issue_date: (i) => i.issue_date,
  due_date: (i) => i.due_date,
  status: (i) => (isOverdue(i) ? "overdue" : i.status),
  total: (i) => Number(i.total),
};
const SORT_KEYS = Object.keys(ACCESSORS);

const InvoicesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    sort?: string;
    dir?: string;
    page?: string;
  }>;
}) => {
  await getUserOrRedirect();
  const params = await searchParams;

  const status =
    params.status &&
    STATUSES.includes(params.status as (typeof STATUSES)[number])
      ? params.status
      : "all";
  const sort = parseSort(params.sort, SORT_KEYS, "issue_date");
  const dir = parseDir(params.dir, "desc");
  const page = parsePage(params.page);

  const supabase = await createClient();
  const all = await listInvoices(supabase);

  const filtered =
    status === "all" ? all : all.filter((i) => matchesStatus(i, status));
  const sorted = sortRows(filtered, sort, dir, ACCESSORS);
  const result = paginate(sorted, page);

  /* Current query, so sorting keeps the filter and vice versa. */
  const current = { status: status === "all" ? undefined : status, sort, dir };
  const sortHref = (key: string) =>
    mergeQuery("/invoices", current, {
      sort: key,
      dir: nextDir(key, sort, dir),
      page: undefined, // a new sort order invalidates the current page
    });
  const pageHref = (p: number) =>
    mergeQuery("/invoices", current, { page: p === 1 ? undefined : String(p) });

  const statusOptions = [
    { key: "all", label: "All invoices", count: all.length },
    ...STATUSES.map((s) => ({
      key: s,
      label: s[0].toUpperCase() + s.slice(1),
      count: all.filter((i) => matchesStatus(i, s)).length,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Bill customers and track what's outstanding."
        action={
          <ButtonLink href="/invoices/new" size="sm">
            <FileText />
            New invoice
          </ButtonLink>
        }
      />

      {/* Pager lives with the filters so it's reachable without scrolling the
          whole table on a short screen. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <FilterSelect
          param="status"
          options={statusOptions}
          value={status}
          aria-label="Filter by status"
        />
        {filtered.length > 0 && (
          <Pagination
            {...result}
            hrefFor={pageHref}
            noun="invoice"
            variant="bar"
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={all.length === 0 ? "No invoices yet" : `No ${status} invoices`}
          description={
            all.length === 0
              ? "Create your first invoice to start getting paid."
              : "Nothing here right now."
          }
          action={
            all.length === 0 ? (
              <ButtonLink href="/invoices/new">
                <FileText />
                New invoice
              </ButtonLink>
            ) : (
              <ButtonLink href="/invoices" variant="secondary">
                View all invoices
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
                  label="Invoice"
                  sortKey="invoice_number"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("invoice_number")}
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
                  label="Due"
                  sortKey="due_date"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("due_date")}
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
              {result.rows.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-brand-accent hover:underline"
                    >
                      {inv.invoice_number || `#${inv.id.slice(0, 8)}`}
                    </Link>
                  </TableCell>
                  <TableCell>{inv.customers?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(inv.issue_date)}
                  </TableCell>
                  <TableCell
                    className={
                      isOverdue(inv)
                        ? "font-medium text-brand-red"
                        : "text-muted-foreground"
                    }
                  >
                    {formatDate(inv.due_date)}
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      status={isOverdue(inv) ? "overdue" : inv.status}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(inv.total)}
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

export default InvoicesPage;
