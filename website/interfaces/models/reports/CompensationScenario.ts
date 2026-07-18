export interface CompensationScenario {
  /** The salary portion, before employer costs. */
  salaryGross: number;
  /** The rest of the total — not deductible, paid from after-tax profit. */
  dividend: number;
  /** Employer CPP/EI on the salary portion. Deductible, and easy to forget. */
  employerCost: number;
  /** salaryGross + employerCost — what the corporation actually deducts. */
  salaryCost: number;

  /** Profit before any compensation: income − expenses. */
  profitBeforeComp: number;
  /** Profit after the salary deduction. Can be negative. */
  netIncome: number;
  corporateTax: number;
  /** What corporate tax would be with no compensation at all. */
  corporateTaxWithoutComp: number;
  /** What the salary portion saves in corporate tax. Dividends contribute 0. */
  corporateTaxOffset: number;
  /** What a dividend can be paid out of, once corporate tax is met. */
  afterTaxProfit: number;

  personalOnSalary: number;
  personalOnDividend: number;
  personalTax: number;
  /** Corporate + personal. The only figure that makes the split decidable. */
  combinedTax: number;
  /** Total compensation less the recipient's personal tax. */
  netToRecipient: number;

  /** max(hstPayable, 0) + corporateTax. */
  setAsideTarget: number;

  /** Salary cost beyond which corporate tax is already nil. */
  breakEvenSalaryCost: number;
  /** True once more salary buys no further corporate-tax reduction. */
  pastBreakEven: boolean;

  /** False when the dividend exceeds the profit available to pay it. */
  dividendFunded: boolean;
  /** How far short the after-tax profit falls. Zero when funded. */
  dividendShortfall: number;
}
