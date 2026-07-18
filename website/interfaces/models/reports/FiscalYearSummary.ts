/**
 * One fiscal year's tax position, as returned by the fiscal_year_summary RPC.
 *
 * income/expenses are net of HST — the figures a corporate return wants. The
 * HST is reported separately because it was never revenue: it's collected on
 * the CRA's behalf and remitted back, less the credits on what was bought.
 */
export interface FiscalYearSummary {
  /** First day of the fiscal year, e.g. "2025-09-01". */
  fy_start: string;
  /** Last day of the fiscal year, e.g. "2026-08-31". The year it's named for. */
  fy_end: string;
  income: number;
  expenses: number;
  hst_collected: number;
  /** HST paid on purchases — the input tax credits. */
  hst_paid: number;
  /** collected − ITCs. Negative means a refund is owed to you. */
  hst_payable: number;
  net_income: number;
  /** Estimated, at the Ontario CCPC small business rate. Zero on a loss. */
  corporate_tax: number;
}
