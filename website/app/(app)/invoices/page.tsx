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
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";

export const metadata: Metadata = { title: "Invoices" };

const InvoicesPage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();
  const invoices = await listInvoices(supabase);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Bill customers and track what's outstanding."
        action={<ButtonLink href="/invoices/new">+ New invoice</ButtonLink>}
      />

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice to start getting paid."
          action={<ButtonLink href="/invoices/new">+ New invoice</ButtonLink>}
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
