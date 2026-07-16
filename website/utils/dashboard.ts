import { Transaction } from "@typings/transaction/Transaction";
import { CashFlowPoint } from "@interfaces/models/dashboard/CashFlowPoint";

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

/** Build a trailing N-month income/expense/net series from transactions. */
export const buildCashFlow = (
  txns: Transaction[],
  months = 12,
): CashFlowPoint[] => {
  const now = new Date();
  const series: CashFlowPoint[] = [];
  const index = new Map<string, CashFlowPoint>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const point: CashFlowPoint = {
      label: d.toLocaleDateString("en-CA", { month: "short" }),
      income: 0,
      expense: 0,
      net: 0,
    };
    series.push(point);
    index.set(monthKey(d), point);
  }

  for (const t of txns) {
    const d = new Date(`${t.txn_date}T00:00:00`);
    const point = index.get(monthKey(d));
    if (!point) continue;
    if (t.direction === "income") point.income += Number(t.amount);
    else point.expense += Number(t.amount);
    point.net = point.income - point.expense;
  }

  return series;
};

/** Sum income/expense for the current calendar month. */
export const currentMonthTotals = (txns: Transaction[]) => {
  const now = new Date();
  const key = monthKey(now);
  return txns.reduce(
    (acc, t) => {
      if (monthKey(new Date(`${t.txn_date}T00:00:00`)) !== key) return acc;
      if (t.direction === "income") acc.income += Number(t.amount);
      else acc.expense += Number(t.amount);
      return acc;
    },
    { income: 0, expense: 0 },
  );
};
