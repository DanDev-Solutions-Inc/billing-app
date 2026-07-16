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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60 text-left text-xs font-medium text-muted">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Issued</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="transition hover:bg-surface-muted/40"
                  >
                    <td className="px-5 py-3 font-medium">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-brand-accent hover:underline"
                      >
                        {inv.invoice_number || `#${inv.id.slice(0, 8)}`}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{inv.customers?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={inv.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">
                      {formatMoney(inv.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
};

export default InvoicesPage;
