import { Transaction } from "@typings/transaction/Transaction";
import { CashFlowPoint } from "@interfaces/models/dashboard/CashFlowPoint";
import { Period } from "@typings/ui/Period";

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

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

/** First day of the month `months - 1` back — the window's inclusive start. */
export const monthsStart = (months: number, now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

/** Sum income/expense/net across the trailing `months` window. */
export const totalsForMonths = (
  txns: Transaction[],
  months: number,
  now = new Date(),
) => {
  const start = monthsStart(months, now);
  const totals = txns.reduce(
    (acc, t) => {
      if (parseDay(t.txn_date) < start) return acc;
      if (t.direction === "income") acc.income += Number(t.amount);
      else acc.expense += Number(t.amount);
      return acc;
    },
    { income: 0, expense: 0 },
  );
  return { ...totals, net: totals.income - totals.expense };
};

/** Monthly income/expense/net series across the trailing `months` window. */
export const buildCashFlowMonths = (
  txns: Transaction[],
  months: number,
  now = new Date(),
): CashFlowPoint[] => {
  const series: CashFlowPoint[] = [];
  const index = new Map<string, CashFlowPoint>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const point: CashFlowPoint = {
      label: d.toLocaleDateString("en-CA", {
        month: "short",
        // Disambiguate once the window can span more than one year.
        ...(months > 12 ? { year: "2-digit" } : {}),
      }),
      income: 0,
      expense: 0,
      net: 0,
    };
    series.push(point);
    index.set(monthKey(d), point);
  }

  for (const t of txns) {
    const point = index.get(monthKey(parseDay(t.txn_date)));
    if (!point) continue;
    if (t.direction === "income") point.income += Number(t.amount);
    else point.expense += Number(t.amount);
    point.net = point.income - point.expense;
  }

  return series;
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


