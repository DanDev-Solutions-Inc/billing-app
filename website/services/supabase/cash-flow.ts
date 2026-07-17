import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { CashFlowMonth } from "@interfaces/models/dashboard/CashFlowMonth";

/**
 * Monthly income/expense for the last `months`, aggregated by Postgres.
 *
 * The dashboard used to fetch every transaction and sum them in JS: 4,693 rows
 * to draw a 6-point chart, and silently only the newest 1,000 of them. This
 * returns one row per month, zero-filled.
 */
export const getMonthlyCashFlow = async (
  sb: SupabaseClient,
  months: number,
): Promise<CashFlowMonth[]> => {
  const { data } = await sb.rpc("monthly_cash_flow", { months });
  return (data ?? []).map((r) => ({
    month: r.month,
    income: Number(r.income),
    expense: Number(r.expense),
  }));
};
