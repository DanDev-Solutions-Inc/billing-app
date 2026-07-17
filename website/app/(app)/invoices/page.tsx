import { Metadata } from "next";
import { FileText } from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listInvoices } from "@services/supabase/invoice";
import { listCustomers } from "@services/supabase/customer";
import { getEmailStates } from "@services/supabase/document-email";
import { EmailStatusIcon } from "@components/email-status-icon";
import {
  PageHeader,
  Card,
  ButtonLink,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SortableHead,
  Pagination,
  FilterSelect,
  FilterCombobox,
  ClearFilters,
  SearchInput,
  FilterBar,
  FilterGroup,
  RowLink,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { isOverdue } from "@utils/invoice";
import { sortRows, paginate, Accessors } from "@utils/table";
import { tableView } from "@utils/table/table-view";
import { InvoiceStatusSelect } from "@components/invoices/status-select";
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
    customer?: string;
    q?: string;
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
  const q = params.q?.trim() ?? "";
  const customerId = params.customer ?? "";
  const { sort, dir, page, sortHref, pageHref } = tableView({
    basePath: "/invoices",
    params,
    sortKeys: SORT_KEYS,
    defaultSort: "issue_date",
    filters: {
      status: status === "all" ? undefined : status,
      customer: customerId || undefined,
      q: q || undefined,
    },
  });

  const supabase = await createClient();
  /* Search + customer run in Postgres, so they cover every invoice rather than
     the page being rendered. Status is derived (overdue isn't stored), so it
     stays a filter over the returned rows. */
  const [all, customers, emailStates] = await Promise.all([
    listInvoices(supabase, { search: q, customerId: customerId || undefined }),
    listCustomers(supabase),
    // One query for every invoice's email state, not one per row.
    getEmailStates(supabase, "invoice"),
  ]);

  const filtered =
    status === "all" ? all : all.filter((i) => matchesStatus(i, status));
  const sorted = sortRows(filtered, sort, dir, ACCESSORS);
  const result = paginate(sorted, page);

  /* FilterCombobox renders the "all" row itself, so only real customers here. */
  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
    hint: c.email ?? undefined,
  }));

  /* Any narrowing at all — search, customer, or status. */
  const isFiltered = Boolean(q || customerId || status !== "all");

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
      <FilterBar>
        {/* Narrowing on the left, then status + the pager on the right. */}
        <FilterGroup className="flex-1">
          <SearchInput
            placeholder="Search number, customer, notes…"
            className="w-full sm:max-w-xs"
          />
          {/* Searchable: 28 customers is past what a native dropdown can scan,
              and the widest name would otherwise stretch the control. */}
          <FilterCombobox
            param="customer"
            options={customerOptions}
            value={customerId}
            allLabel="All customers"
            placeholder="All customers"
            className="w-full sm:w-56"
            aria-label="Filter by customer"
          />
          <ClearFilters href="/invoices" active={isFiltered} />
        </FilterGroup>
        <FilterGroup>
          <FilterSelect
            param="status"
            options={statusOptions}
            value={status}
            aria-label="Filter by status"
          />
          <Pagination
            {...result}
            hrefFor={pageHref}
            noun="invoice"
            variant="bar"
          />
        </FilterGroup>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          /* An empty *result* isn't an empty ledger — a search or filter that
             matches nothing shouldn't read as "you have no invoices". */
          title={
            isFiltered
              ? "No matches"
              : all.length === 0
                ? "No invoices yet"
                : `No ${status} invoices`
          }
          description={
            isFiltered
              ? q
                ? `No invoice matches “${q}”.`
                : "Nothing matches these filters."
              : all.length === 0
                ? "Create your first invoice to start getting paid."
                : "Nothing here right now."
          }
          action={
            all.length === 0 && !isFiltered ? (
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
                  className="w-full"
                />
                <SortableHead
                  label="Issued"
                  sortKey="issue_date"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("issue_date")}
                  className="hidden md:table-cell"
                />
                <SortableHead
                  label="Due"
                  sortKey="due_date"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("due_date")}
                  className="hidden sm:table-cell"
                />
                <SortableHead
                  label="Status"
                  sortKey="status"
                  activeKey={sort}
                  activeDir={dir}
                  href={sortHref("status")}
                  className="hidden sm:table-cell"
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
                    <span className="flex items-center gap-1.5">
                      {/* Opens from anywhere on the row — see RowLink. */}
                      <RowLink
                        href={`/invoices/${inv.id}`}
                        className="text-brand-accent"
                      >
                        {inv.invoice_number || `#${inv.id.slice(0, 8)}`}
                      </RowLink>
                      {/* Glance state of the last email for this invoice —
                          nothing if it was never sent. */}
                      <EmailStatusIcon state={emailStates.get(inv.id) ?? null} />
                    </span>
                  </TableCell>
                  {/* Customer carries the row on mobile; the dates and status
                      fold underneath rather than overflowing as columns. */}
                  <TableCell className="w-full max-w-0">
                    <span className="block truncate">
                      {inv.customers?.name ?? "—"}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-xs sm:hidden ${
                        isOverdue(inv)
                          ? "font-medium text-brand-red"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isOverdue(inv)
                        ? `Overdue ${formatDate(inv.due_date)}`
                        : inv.status === "paid"
                          ? `Paid · ${formatDate(inv.issue_date)}`
                          : `${inv.status === "sent" ? "Sent" : "Draft"} · due ${formatDate(inv.due_date)}`}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDate(inv.issue_date)}
                  </TableCell>
                  <TableCell
                    className={
                      "hidden sm:table-cell " +
                      (isOverdue(inv)
                        ? "font-medium text-brand-red"
                        : "text-muted-foreground")
                    }
                  >
                    {formatDate(inv.due_date)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {/* Editable in place: status is the field that actually
                        changes day to day, and opening the invoice to flip it
                        was the long way round. */}
                    <InvoiceStatusSelect
                      id={inv.id}
                      status={inv.status}
                      overdue={isOverdue(inv)}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(inv.total, inv.currency)}
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
