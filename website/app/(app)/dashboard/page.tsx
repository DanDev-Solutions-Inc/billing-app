import { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  UserPlus,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listInvoices } from "@services/supabase/invoice";
import { listTransactions } from "@services/supabase/transaction";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ButtonLink,
  IconTile,
  FilterSelect,
} from "@components/ui";
import { CashFlowChart } from "@components/charts/cash-flow-chart";
import {
  parseMonths,
  totalsForMonths,
  buildCashFlowMonths,
  MONTH_RANGES,
  DEFAULT_MONTHS,
} from "@utils/period";
import { formatMoney, formatDate } from "@utils/money";
import { isOverdue, isOutstanding } from "@utils/invoice";

export const metadata: Metadata = { title: "Dashboard" };

/* Vision UI in-card metric: gradient icon tile + label over value. */
const Metric = ({
  label,
  value,
  icon,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: string;
}) => (
  <div className="flex items-center gap-3">
    <IconTile className="size-9 rounded-lg [&_svg]:size-4">{icon}</IconTile>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`truncate text-sm font-bold tabular-nums ${tone}`}>
        {value}
      </p>
    </div>
  </div>
);

const MONTH_OPTIONS = MONTH_RANGES.map((m) => ({
  key: String(m),
  label: `${m} months`,
}));

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) => {
  await getUserOrRedirect();
  const months = parseMonths((await searchParams).months);
  const supabase = await createClient();

  /* Estimates are no longer surfaced here, so we don't pay to fetch them. */
  const [invoices, transactions] = await Promise.all([
    listInvoices(supabase),
    listTransactions(supabase),
  ]);

  /* Outstanding is deliberately all-time: an unpaid invoice is unpaid
     regardless of when it was issued. Overdue is a derived subset of it
     (past due_date) — there is no stored "overdue" status. */
  const outstandingInvoices = invoices.filter(isOutstanding);
  const overdueInvoices = outstandingInvoices.filter(isOverdue);
  const outstanding = outstandingInvoices.reduce(
    (s, i) => s + Number(i.total),
    0,
  );
  const overdue = overdueInvoices.reduce((s, i) => s + Number(i.total), 0);

  /* Overdue first — those are the ones that need chasing. */
  const outstandingSorted = [...outstandingInvoices].sort(
    (a, b) => Number(isOverdue(b)) - Number(isOverdue(a)),
  );

  /* Chart + the totals under it share one window. */
  const totals = totalsForMonths(transactions, months);
  const cashFlow = buildCashFlowMonths(transactions, months);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your business at a glance."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/customers" variant="secondary" size="sm">
              <UserPlus />
              New customer
            </ButtonLink>
            <ButtonLink
              href="/transactions/new"
              variant="secondary"
              size="sm"
            >
              <Plus />
              New transaction
            </ButtonLink>
            <ButtonLink href="/invoices/new" size="sm">
              <FileText />
              New invoice
            </ButtonLink>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Cash flow</CardTitle>
            {/* The range drives the chart *and* the totals below it. */}
            <FilterSelect
              param="months"
              options={MONTH_OPTIONS}
              value={String(months)}
              allKey={String(DEFAULT_MONTHS)}
              aria-label="Cash flow range"
            />
          </CardHeader>
          {/* min-h-0 lets the flex child shrink so the chart can own the space */}
          <CardContent className="min-h-0 flex-1 pb-4 pl-2">
            <CashFlowChart data={cashFlow} />
          </CardContent>
          {/* The period's totals live with the chart that plots them — showing
              them again as separate tiles up top was pure duplication. */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/[0.06] px-6 py-4">
            <Metric
              label="Income"
              value={formatMoney(totals.income)}
              icon={<ArrowDownLeft />}
            />
            <Metric
              label="Expenses"
              value={formatMoney(totals.expense)}
              icon={<ArrowUpRight />}
            />
            <Metric
              label="Net"
              value={formatMoney(totals.net)}
              icon={<Wallet />}
              tone={totals.net >= 0 ? "text-brand-green" : "text-brand-red"}
            />
          </div>
        </Card>

        {/* One unpaid panel: the all-time total, overdue called out inside it,
            and the invoices themselves. No separate status breakdown. */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Outstanding</CardTitle>
              <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {formatMoney(outstanding)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {outstandingInvoices.length} unpaid · all time
              </p>
            </div>
            <Link
              href="/invoices?status=sent"
              className="shrink-0 text-xs font-medium text-brand-accent hover:underline"
            >
              View all
            </Link>
          </CardHeader>

          {overdueInvoices.length > 0 && (
            <div className="mx-6 mb-3 flex items-center justify-between gap-3 rounded-xl border border-brand-red/25 bg-brand-red/10 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-medium text-brand-red">
                <AlertTriangle className="size-4" />
                {overdueInvoices.length} overdue
              </span>
              <span className="text-sm font-bold tabular-nums text-brand-red">
                {formatMoney(overdue)}
              </span>
            </div>
          )}

          <CardContent className="min-h-0 flex-1 pt-0">
            {outstandingInvoices.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                Nothing outstanding. Nice.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {outstandingSorted.slice(0, 7).map((inv) => (
                  <li key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:opacity-80"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium text-foreground">
                            {inv.customers?.name ?? "—"}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {inv.invoice_number || `#${inv.id.slice(0, 8)}`}
                          </span>
                        </span>
                        {/* Due date is the whole point of an unpaid list —
                            it turns red once it's past. */}
                        <span
                          className={`mt-0.5 block text-xs ${
                            isOverdue(inv)
                              ? "font-medium text-brand-red"
                              : "text-muted-foreground"
                          }`}
                        >
                          {inv.due_date
                            ? `${isOverdue(inv) ? "Overdue" : "Due"} ${formatDate(inv.due_date)}`
                            : "No due date"}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
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
    </>
  );
};

export default DashboardPage;
