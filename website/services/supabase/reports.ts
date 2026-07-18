import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { FiscalYearSummary } from "@interfaces/models/reports/FiscalYearSummary";
import { BUSINESS } from "@utils/constants";

/**
 * Income, expenses, HST and estimated corporate tax for every fiscal year with
 * activity, newest first.
 *
 * Aggregated by Postgres — summing in JS would silently stop at PostgREST's
 * 1,000-row cap and under-report the older years (see monthly_cash_flow).
 */
export const getFiscalYearSummary = async (
  sb: SupabaseClient,
): Promise<FiscalYearSummary[]> => {
  const { data } = await sb.rpc("fiscal_year_summary", {
    year_end_month: BUSINESS.fiscalYearEndMonth,
    tax_rate: BUSINESS.taxRate,
    corp_tax_rate: BUSINESS.corpTaxRate,
  });
  return (data ?? []).map((r) => ({
    fy_start: r.fy_start,
    fy_end: r.fy_end,
    income: Number(r.income),
    expenses: Number(r.expenses),
    hst_collected: Number(r.hst_collected),
    hst_paid: Number(r.hst_paid),
    hst_payable: Number(r.hst_payable),
    net_income: Number(r.net_income),
    corporate_tax: Number(r.corporate_tax),
  }));
};
