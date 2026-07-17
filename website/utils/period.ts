import { CashFlowPoint } from "@interfaces/models/dashboard/CashFlowPoint";
import { CashFlowMonth } from "@interfaces/models/dashboard/CashFlowMonth";
import { toIsoDate } from "@utils/date";
import { Period } from "@typings/ui/Period";

/** Parse a `?period=` search param. Unknown / missing values default to month. */
export const parsePeriod = (value?: string): Period =>
  value === "year" || value === "all" ? value : "month";

/* --- Rolling month window (dashboard) ----------------------------------- */

export const MONTH_RANGES = [3, 6, 12, 24] as const;
export type MonthRange = (typeof MONTH_RANGES)[number];
export const DEFAULT_MONTHS: MonthRange = 6;

/** Parse a `?months=` search param. Unknown / missing values default to 6. */
export const parseMonths = (value?: string): MonthRange => {
  const n = Number(value);
  return (MONTH_RANGES as readonly number[]).includes(n)
    ? (n as MonthRange)
    : DEFAULT_MONTHS;
};

export const PERIOD_LABEL: Record<Period, string> = {
  month: "This month",
  year: "This year",
  all: "All time",
};

/** Parse a `YYYY-MM-DD` column as a local date (avoids UTC shift). */
export const parseDay = (value: string) => new Date(`${value}T00:00:00`);

/**
 * Inclusive start of the window. `all` has no lower bound.
 * The upper bound is always "now", so no end date is needed.
 */
export const periodStart = (period: Period, now = new Date()): Date | null => {
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
};

/** Is a `YYYY-MM-DD` date inside the period window? */
export const inPeriod = (value: string, period: Period, now = new Date()) => {
  const start = periodStart(period, now);
  if (!start) return true;
  return parseDay(value) >= start;
};



/**
 * Turn the SQL monthly aggregate into chart points.
 *
 * The months arrive zero-filled from Postgres, so this only labels them and
 * derives net — no bucketing, no date parsing per row. The year is shown once
 * a window spans one, so "Jan" isn't ambiguous across two of them.
 */
export const toCashFlowPoints = (
  months: CashFlowMonth[],
  showYear = false,
): CashFlowPoint[] =>
  months.map((m) => ({
    label: new Date(`${m.month}T00:00:00`).toLocaleDateString("en-CA", {
      month: "short",
      ...(showYear ? { year: "2-digit" as const } : {}),
    }),
    income: m.income,
    expense: m.expense,
    net: m.income - m.expense,
  }));

/** Income/expense/net across an already-aggregated window. */
export const totalsForCashFlow = (months: CashFlowMonth[]) => {
  const income = months.reduce((s, m) => s + m.income, 0);
  const expense = months.reduce((s, m) => s + m.expense, 0);
  return { income, expense, net: income - expense };
};

/**
 * The period's start as yyyy-mm-dd, or undefined for "all time".
 *
 * The date form (not a Date) because it goes straight into a Postgres
 * `gte(txn_date, …)` — the window is applied by the query, not by filtering
 * rows after the fact.
 */
export const periodStartIso = (period: Period): string | undefined => {
  const start = periodStart(period);
  return start ? toIsoDate(start) : undefined;
};
