import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listInvoices } from "@services/supabase/invoice";
import { listEstimates } from "@services/supabase/estimate";
import { listTransactions } from "@services/supabase/transaction";
import { PageHeader, Card, ButtonLink } from "@components/ui";
import { CashFlowChart } from "@components/charts/cash-flow-chart";
import { buildCashFlow, currentMonthTotals } from "@utils/dashboard";
import { formatMoney, formatDate } from "@utils/money";
import { StatCardProps } from "@interfaces/components/StatCardProps";

export const metadata: Metadata = { title: "Dashboard" };

const StatCard = ({ label, value, hint }: StatCardProps) => (
  <Card className="p-5">
    <p className="text-xs font-medium uppercase tracking-wide text-muted">
      {label}
    </p>
    <p className="mt-1 text-2xl font-semibold tabular-nums text-brand-black">
      {value}
    </p>
    {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
  </Card>
);

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
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-brand-black">
              Cash flow
            </h2>
            <span className="text-xs text-muted">Last 12 months</span>
          </div>
          <CashFlowChart data={cashFlow} />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-heading text-base font-semibold text-brand-black">
            Outstanding invoices
          </h2>
          {outstandingInvoices.length === 0 ? (
            <p className="text-sm text-muted">Nothing outstanding. Nice.</p>
          ) : (
            <ul className="divide-y divide-border">
              {outstandingInvoices.slice(0, 6).map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:opacity-80"
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-brand-black">
                        {inv.customers?.name ?? "—"}
                      </span>
                      <span className="ml-2 text-muted">
                        {inv.invoice_number || `#${inv.id.slice(0, 8)}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums font-medium">
                        {formatMoney(inv.total)}
                      </span>
                      {inv.due_date && (
                        <span className="text-xs text-muted">
                          {formatDate(inv.due_date)}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default DashboardPage;
