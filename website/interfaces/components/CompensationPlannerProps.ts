import { PlanningSettings } from "@interfaces/models/reports/PlanningSettings";

export interface CompensationPlannerProps {
  /** The saved plan, or defaults when nothing has been saved yet. */
  settings: PlanningSettings;
  /** Fiscal-year-to-date income, net of HST. */
  income: number;
  /** Fiscal-year-to-date expenses, net of HST. */
  expenses: number;
  /** Feeds the set-aside target alongside corporate tax. */
  hstPayable: number;
}
