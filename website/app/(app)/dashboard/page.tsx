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
  FilterTabs,
} from "@components/ui";
import { CashFlowChart } from "@components/charts/cash-flow-chart";
import { InvoiceStatusBars } from "@components/charts/invoice-status-bars";
import {
  parsePeriod,
  totalsForPeriod,
  buildCashFlowForPeriod,
  inPeriod,
  PERIOD_LABEL,
} from "@utils/period";
import { formatMoney } from "@utils/money";

export const metadata: Metadata = { title: "Dashboard" };

const PERIOD_TABS = [
  { key: "month", label: "Month", href: "/dashboard" },
  { key: "year", label: "Year", href: "/dashboard?period=year" },
  { key: "all", label: "All time", href: "/dashboard?period=all" },
];

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) => {
  await getUserOrRedirect();
  const period = parsePeriod((await searchParams).period);
  const supabase = await createClient();

  const [invoices, estimates, transactions] = await Promise.all([
    listInvoices(supabase),
    listEstimates(supabase),
    listTransactions(supabase),
  ]);

  /* Scope every metric to the selected window. Invoices/estimates use their
     issue date; outstanding stays all-time since unpaid is unpaid. */
  const periodInvoices = invoices.filter((i) =>
    inPeriod(i.issue_date, period),
  );
  const periodEstimates = estimates.filter((e) =>
    inPeriod(e.issue_date, period),
  );

  const outstandingInvoices = invoices.filter((i) => i.status === "sent");
  const outstanding = outstandingInvoices.reduce(
    (s, i) => s + Number(i.total),
    0,
  );
  const totals = totalsForPeriod(transactions, period);
  const openEstimates = periodEstimates.filter(
    (e) => e.status === "draft" || e.status === "sent",
  ).length;
  const cashFlow = buildCashFlowForPeriod(transactions, period);

  const statusRows = (["paid", "sent", "overdue", "draft"] as const).map(
    (status) => {
      const set = periodInvoices.filter((i) => i.status === status);
      return {
        status,
        count: set.length,
        total: set.reduce((s, i) => s + Number(i.total), 0),
      };
    },
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your business at a glance."
        action={<ButtonLink href="/invoices/new">+ New invoice</ButtonLink>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <span className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {PERIOD_LABEL[period].toLowerCase()}
          </span>
        </span>
        <FilterTabs
          tabs={PERIOD_TABS}
          active={period}
          variant="segmented"
          aria-label="Metric period"
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          tone="accent"
          hint={`${outstandingInvoices.length} unpaid invoice${outstandingInvoices.length === 1 ? "" : "s"} · all time`}
        />
        <StatCard
          label="Income"
          value={formatMoney(totals.income)}
          tone="income"
        />
        <StatCard
          label="Expenses"
          value={formatMoney(totals.expense)}
          tone="expense"
        />
        <StatCard
          label="Net"
          value={formatMoney(totals.net)}
          tone={totals.net >= 0 ? "income" : "expense"}
          hint={`${openEstimates} open estimate${openEstimates === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Cash flow</CardTitle>
            <span className="text-xs text-muted-foreground">
              {cashFlow.length} month{cashFlow.length === 1 ? "" : "s"}
            </span>
          </CardHeader>
          {/* min-h-0 lets the flex child shrink so the chart can own the space */}
          <CardContent className="min-h-0 flex-1 pb-4 pl-2">
            <CashFlowChart data={cashFlow} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoices by status</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceStatusBars rows={statusRows} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Outstanding</CardTitle>
              <Link
                href="/invoices"
                className="text-xs font-medium text-brand-accent hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="py-2">
              {outstandingInvoices.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Nothing outstanding. Nice.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {outstandingInvoices.slice(0, 5).map((inv) => (
                    <li key={inv.id}>
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:opacity-80"
                      >
                        <span className="min-w-0 truncate">
                          <span className="font-medium text-foreground">
                            {inv.customers?.name ?? "—"}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {inv.invoice_number || `#${inv.id.slice(0, 8)}`}
                          </span>
                        </span>
                        <span className="tabular-nums font-medium">
                          {formatMoney(inv.total)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
