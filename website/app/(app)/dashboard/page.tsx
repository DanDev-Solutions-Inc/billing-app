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
  Repeat,
  Receipt,
} from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listInvoices } from "@services/supabase/invoice";
import { listTransactions } from "@services/supabase/transaction";
import { listRecurring } from "@services/supabase/recurring-invoice";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ButtonLink,
  IconTile,
  FilterSelect,
  CurrencyNote,
} from "@components/ui";
import { CashFlowChart } from "@components/charts/cash-flow-chart";
import {
  parseMonths,
  totalsForMonths,
  buildCashFlowMonths,
  MONTH_RANGES,
  DEFAULT_MONTHS,
} from "@utils/period";
import { formatMoney, formatDate, computeTotals } from "@utils/money";
import { sumInCad, toCad, rateFor } from "@utils/fx";
import { isOverdue, isOutstanding } from "@utils/invoice";
import { cadenceLabel } from "@utils/cadence";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

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

/* Invoices per year at interval 1, so schedules on different cadences can be
   summed into one comparable figure. Annual rather than monthly on purpose: a
   weekly schedule bills 52×, which is 4.33 months' worth — a "per month" number
   is an average no month ever actually matches. */
const YEARLY_FACTOR: Record<string, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  yearly: 1,
};

/* Relative day count, so "in 3 days" reads at a glance rather than a date. */
const daysUntil = (iso: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / 86_400_000,
  );
};

const dueLabel = (iso: string) => {
  const days = daysUntil(iso);
  if (days < 0) return "Due now";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 14) return `In ${days} days`;
  return formatDate(iso);
};

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) => {
  await getUserOrRedirect();
  const months = parseMonths((await searchParams).months);
  const supabase = await createClient();

  /* Estimates are no longer surfaced here, so we don't pay to fetch them. */
  const [invoices, transactions, schedules] = await Promise.all([
    listInvoices(supabase),
    listTransactions(supabase),
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

  /* Chart + the totals under it share one window. */
  const totals = totalsForMonths(transactions, months);
  const cashFlow = buildCashFlowMonths(transactions, months);

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
  const yearlyRun = upcoming.reduce(
    (sum, s) =>
      sum +
      /* Nothing's been invoiced yet, so there's no stored rate — a forward
         projection uses today's. It's an estimate either way. */
      (toCad(s.total, rateFor(s.currency)) * YEARLY_FACTOR[s.frequency]) /
        Math.max(1, s.interval),
    0,
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your business at a glance."
        action={
          /* Quick actions stack full-width on mobile so each is a real thumb
             target, and sit inline from sm up. */
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <ButtonLink href="/customers" variant="secondary" size="sm">
              <UserPlus />
              New customer
            </ButtonLink>
            <ButtonLink href="/receipts/new" variant="secondary" size="sm">
              <Receipt />
              Add receipt
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
                {formatMoney(outstanding.cad)}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                <span>{outstandingInvoices.length} unpaid · all time</span>
                <CurrencyNote total={outstanding} />
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
                {formatMoney(overdue.cad)}
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
                        {formatMoney(inv.total, inv.currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recurring — money that bills itself. The point is what's coming and
          when, so it leads with the next run rather than a status column. */}
      <Card className="mt-6 flex flex-col">
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Recurring invoices</CardTitle>
            <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {formatMoney(yearlyRun)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              per year · {upcoming.length} active{" "}
              {upcoming.length === 1 ? "schedule" : "schedules"}
            </p>
          </div>
          <Link
            href="/recurring"
            className="shrink-0 text-xs font-medium text-brand-accent hover:underline"
          >
            View all
          </Link>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 pt-0">
          {upcoming.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-2">
              <p className="text-sm text-muted-foreground">
                No active schedules — set one up to bill a customer automatically.
              </p>
              <ButtonLink href="/recurring/new" variant="secondary" size="sm">
                <Repeat />
                New schedule
              </ButtonLink>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {upcoming.slice(0, 5).map((s) => {
                const overdueRun = daysUntil(s.next_run) < 0;
                return (
                  <li key={s.id}>
                    <Link
                      href="/recurring"
                      className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:opacity-80"
                    >
                      {/* Name owns its own line — cadence and auto-emails
                          beside it squeezed it to "Quality E…" on mobile. The
                          rest stacks underneath as one meta line. */}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">
                          {s.customers?.name ?? s.title ?? "Untitled"}
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-xs ${
                            overdueRun
                              ? "font-medium text-brand-red"
                              : "text-muted-foreground"
                          }`}
                        >
                          {[
                            cadenceLabel(s.frequency, s.interval),
                            s.auto_send ? "auto-emails" : null,
                            `Next invoice ${dueLabel(s.next_run)}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatMoney(s.total, s.currency)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardPage;
