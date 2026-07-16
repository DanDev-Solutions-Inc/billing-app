import { Metadata } from "next";
import Link from "next/link";
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
  TableHead,
  TableCell,
  FilterSelect,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";

export const metadata: Metadata = { title: "Invoices" };

/* Invoices are a working list, not a time report: no date window here — an
   unpaid invoice matters regardless of when it was issued. */
const STATUSES = ["sent", "paid", "overdue"] as const;

const InvoicesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) => {
  await getUserOrRedirect();
  const params = await searchParams;
  const status =
    params.status && STATUSES.includes(params.status as (typeof STATUSES)[number])
      ? params.status
      : "all";

  const supabase = await createClient();
  const all = await listInvoices(supabase);
  const invoices =
    status === "all" ? all : all.filter((i) => i.status === status);

  const statusOptions = [
    { key: "all", label: "All invoices", count: all.length },
    ...STATUSES.map((s) => ({
      key: s,
      label: s[0].toUpperCase() + s.slice(1),
      count: all.filter((i) => i.status === s).length,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Bill customers and track what's outstanding."
        action={<ButtonLink href="/invoices/new">+ New invoice</ButtonLink>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <FilterSelect
          param="status"
          options={statusOptions}
          value={status}
          aria-label="Filter by status"
        />
        <span className="text-xs text-muted-foreground">
          {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
        </span>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title={
            all.length === 0 ? "No invoices yet" : `No ${status} invoices`
          }
          description={
            all.length === 0
              ? "Create your first invoice to start getting paid."
              : "Nothing here right now."
          }
          action={
            all.length === 0 ? (
              <ButtonLink href="/invoices/new">+ New invoice</ButtonLink>
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
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
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
                  <TableCell className="text-muted-foreground">
                    {formatDate(inv.due_date)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={inv.status} />
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
