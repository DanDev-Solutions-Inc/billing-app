export interface CompensationScenarioInput {
  /** Fiscal-year-to-date income, net of HST. */
  income: number;
  /** Fiscal-year-to-date expenses, net of HST. Payroll-free already. */
  expenses: number;
  /** Intended compensation for a full year (the monthly figure × 12). */
  annualTotal: number;
  /** 100 = all salary, 0 = all dividend. */
  salarySharePercent: number;
  /** Employer CPP/EI, charged on the salary portion only. */
  employerCostPercent: number;
  corpTaxRate: number;
  /** Flat effective rate standing in for progressive employment-income tax. */
  personalSalaryRate: number;
  /** Flat effective rate standing in for the gross-up and dividend tax credit. */
  personalDividendRate: number;
  /** Feeds the set-aside target alongside corporate tax. */
  hstPayable: number;
}
