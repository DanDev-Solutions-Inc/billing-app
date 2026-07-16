import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listInvoices } from "@services/supabase/invoice";
import { listEstimates } from "@services/supabase/estimate";
import { listTransactions } from "@services/supabase/transaction";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ButtonLink,
  StatCard,
} from "@components/ui";
import { CashFlowChart } from "@components/charts/cash-flow-chart";
import { buildCashFlow, currentMonthTotals } from "@utils/dashboard";
import { formatMoney, formatDate } from "@utils/money";

export const metadata: Metadata = { title: "Dashboard" };

const DashboardPage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();

  const [invoices, estimates, transactions] = await Promise.all([
    listInvoices(supabase),
    listEstimates(supabase),
    listTransactions(supabase),
  ]);

  const outstandingInvoices = invoices.filter((i) => i.status === "sent");
  const outstanding = outstandingInvoices.reduce(
    (s, i) => s + Number(i.total),
    0,
  );
  const month = currentMonthTotals(transactions);
  const openEstimates = estimates.filter(
    (e) => e.status === "draft" || e.status === "sent",
  ).length;
  const cashFlow = buildCashFlow(transactions);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your business at a glance."
        action={<ButtonLink href="/invoices/new">+ New invoice</ButtonLink>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          hint={`${outstandingInvoices.length} unpaid invoice${outstandingInvoices.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Income this month"
          value={formatMoney(month.income)}
        />
        <StatCard
          label="Expenses this month"
          value={formatMoney(month.expense)}
        />
        <StatCard
          label="Open estimates"
          value={String(openEstimates)}
          hint={`${estimates.length} total`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Cash flow</CardTitle>
            <span className="text-xs text-muted-foreground">Last 12 months</span>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={cashFlow} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding invoices</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            {outstandingInvoices.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">
                Nothing outstanding. Nice.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {outstandingInvoices.slice(0, 6).map((inv) => (
                  <li key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:opacity-80"
                    >
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">
                          {inv.customers?.name ?? "—"}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {inv.invoice_number || `#${inv.id.slice(0, 8)}`}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums font-medium">
                          {formatMoney(inv.total)}
                        </span>
                        {inv.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(inv.due_date)}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DashboardPage;
