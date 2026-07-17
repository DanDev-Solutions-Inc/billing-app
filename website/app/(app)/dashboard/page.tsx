import { Metadata } from "next";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  UserPlus,
  FileText,
  Receipt,
} from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listInvoices } from "@services/supabase/invoice";
import { getMonthlyCashFlow } from "@services/supabase/cash-flow";
import { listRecurring } from "@services/supabase/recurring-invoice";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ButtonLink,
  Metric,
  FilterSelect,
} from "@components/ui";
import { CashFlowChart } from "@components/charts/cash-flow-chart";
import { OutstandingCard } from "@components/dashboard/outstanding-card";
import { RecurringCard } from "@components/dashboard/recurring-card";
import { MobileRangeDefault } from "@components/dashboard/mobile-range-default";
import {
  parseMonths,
  totalsForCashFlow,
  toCashFlowPoints,
  MONTH_RANGES,
  DEFAULT_MONTHS,
} from "@utils/period";
import { formatMoney, computeTotals } from "@utils/money";
import { sumInCad, toCad, rateFor } from "@utils/fx";
import { isOverdue, isOutstanding } from "@utils/invoice";
import { yearlyAmount } from "@utils/cadence";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

export const metadata: Metadata = { title: "Dashboard" };



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
  const params = await searchParams;
  const months = parseMonths(params.months);
  /* Whether the range was chosen, vs. fallen back to the default — a phone
     narrows an unchosen range to 3 months (see MobileRangeDefault). */
  const hasExplicitRange = Boolean(params.months);
  const supabase = await createClient();
  /* Estimates are no longer surfaced here, so we don't pay to fetch them. */
  const [invoices, cashFlowMonths, schedules] = await Promise.all([
    listInvoices(supabase),
    getMonthlyCashFlow(supabase, months),
    listRecurring(supabase),
  ]);

  /* Outstanding is deliberately all-time: an unpaid invoice is unpaid
     regardless of when it was issued. Overdue is a derived subset of it
     (past due_date) — there is no stored "overdue" status. */
  const outstandingInvoices = invoices.filter(isOutstanding);
  const overdueInvoices = outstandingInvoices.filter(isOverdue);
  /* Reported in CAD. A USD invoice converts at the rate stored on it, so the
     figure is stable and adding the two currencies together means something. */
  const outstanding = sumInCad(outstandingInvoices);
  const overdue = sumInCad(overdueInvoices);

  /* Overdue first — those are the ones that need chasing. */
  const outstandingSorted = [...outstandingInvoices].sort(
    (a, b) => Number(isOverdue(b)) - Number(isOverdue(a)),
  );

  /* Chart + the totals under it share one window, aggregated by Postgres —
     6 rows rather than every transaction summed in JS. */
  const totals = totalsForCashFlow(cashFlowMonths);
  const cashFlow = toCashFlowPoints(cashFlowMonths, months > 12);

  /* Only live schedules bill anyone — a paused one has no next invoice, so it
     belongs on the Recurring page, not here. Soonest first. */
  const upcoming = schedules
    .filter((s) => s.active)
    .map((s) => ({
      ...s,
      total: computeTotals(
        (s.line_items as unknown as LineItemFormValues[]) ?? [],
        Number(s.tax_rate),
      ).total,
    }))
    .sort((a, b) => a.next_run.localeCompare(b.next_run));

  /* What the live schedules bill in a year. Exact for every cadence, unlike a
     monthly figure — $621.50 weekly is exactly $32,318/yr, but "$2,693.17/mo"
     is an average you'd never see on a statement. */
  /* Nothing's been invoiced yet, so there's no stored rate — a forward
     projection uses today's. It's an estimate either way. */
  const yearlyRun = upcoming.reduce(
    (sum, s) =>
      sum +
      yearlyAmount({ ...s, total: toCad(s.total, rateFor(s.currency)) }),
    0,
  );

  return (
    <>
      <MobileRangeDefault hasExplicitRange={hasExplicitRange} />
      <PageHeader
        title="Dashboard"
        subtitle="Your business at a glance."
        action={
          /* Quick actions stack full-width on mobile so each is a real thumb
             target, and sit inline from sm up. */
          /* Add receipt leads on mobile with its own full row — it's the one
             you reach for on a phone, standing in front of a counter. The
             primary takes the next full row; the rest pair up. Inline from sm. */
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <ButtonLink
              href="/receipts/new"
              variant="secondary"
              size="sm"
              className="col-span-2 sm:col-auto"
            >
              <Receipt />
              Add receipt
            </ButtonLink>
            <ButtonLink
              href="/invoices/new"
              size="sm"
              className="col-span-2 sm:col-auto"
            >
              <FileText />
              New invoice
            </ButtonLink>
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
          </div>
        }
      />

      {/* [&>*]:min-w-0 — grid items are `min-width: auto` by default, so a
          card can't shrink below its content (a wide chart or a long customer
          name) and would push the column past the screen. */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle className="shrink-0">Cash flow</CardTitle>
            {/* The range drives the chart *and* the totals below it.
                w-auto: the kit default goes full-width on mobile for filter
                bars, which in a card header would wrap the title. */}
            <FilterSelect
              param="months"
              options={MONTH_OPTIONS}
              value={String(months)}
              allKey={String(DEFAULT_MONTHS)}
              aria-label="Cash flow range"
              className="w-auto shrink-0"
            />
          </CardHeader>
          {/* min-h-0 lets the flex child shrink so the chart can own the space */}
          <CardContent className="min-h-0 flex-1 pb-4 pl-2">
            <CashFlowChart data={cashFlow} />
          </CardContent>
          {/* The period's totals live with the chart that plots them — showing
              them again as separate tiles up top was pure duplication.
              Stacked on mobile: three across truncated the amounts to
              "$138,36…", and a money figure you can't read isn't a metric. */}
          <div className="grid gap-4 border-t border-white/[0.06] px-6 py-4 sm:grid-cols-3">
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
        <OutstandingCard
          outstanding={outstanding}
          outstandingInvoices={outstandingInvoices}
          overdue={overdue}
          overdueInvoices={overdueInvoices}
          outstandingSorted={outstandingSorted}
        />
      </div>

      {/* Recurring — money that bills itself. The point is what's coming and
          when, so it leads with the next run rather than a status column.
          mt-6 matches the grid's own gap-6 so it doesn't butt against the row
          above it — the grid only spaces its own children, not this sibling. */}
      <div className="mt-6">
        <RecurringCard yearlyRun={yearlyRun} upcoming={upcoming} />
      </div>
    </>
  );
};

export default DashboardPage;
