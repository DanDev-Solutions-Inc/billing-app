export interface PlanningSettings {
  /** Intended compensation per month, before the salary/dividend split. */
  monthly_total: number;
  /** 100 = all salary, 0 = all dividend. */
  salary_share_percent: number;
  /** Employer CPP/EI on the salary portion. */
  employer_cost_percent: number;
  /** Flat effective personal rate on employment income. */
  personal_salary_rate: number;
  /** Flat effective personal rate on dividends. */
  personal_dividend_rate: number;
}
