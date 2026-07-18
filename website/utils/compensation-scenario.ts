import { CompensationScenarioInput } from "@interfaces/models/reports/CompensationScenarioInput";
import { CompensationScenario } from "@interfaces/models/reports/CompensationScenario";
import { round2 } from "@utils/money";

/**
 * Salary vs dividend, and what each does to the tax bill.
 *
 * Pure on purpose, and imported by BOTH the server render and the client
 * slider. If the two sides computed this separately they would eventually
 * disagree by a cent and produce a hydration mismatch on a page that currently
 * ships no client JS at all.
 *
 * The mechanism worth understanding before reading the maths:
 *
 * - Salary is a *deductible expense*. It lowers the corporation's taxable
 *   income, so it lowers corporate tax — and it drags employer CPP/EI along as
 *   an extra cost, which is itself deductible.
 * - A dividend is *not* deductible. It is paid out of profit the corporation
 *   has already been taxed on, so it does nothing to corporate tax, and it can
 *   only be paid out of what's actually left after that tax.
 *
 * Which is why the corporate side alone would be a rigged comparison: it can
 * only ever favour salary. The dividend's advantage lives entirely in the
 * recipient's hands (no CPP, and the dividend tax credit), so the personal side
 * has to be in the model for the split to mean anything — even approximated by
 * the flat rates below.
 */
export const computeCompensationScenario = (
  input: CompensationScenarioInput,
): CompensationScenario => {
  const {
    income,
    expenses,
    annualTotal,
    salarySharePercent,
    employerCostPercent,
    corpTaxRate,
    personalSalaryRate,
    personalDividendRate,
    hstPayable,
  } = input;

  const share = clamp(salarySharePercent, 0, 100);
  const total = Math.max(annualTotal, 0);

  const salaryGross = round2((total * share) / 100);
  /* Derived by subtraction rather than its own percentage, so the two parts
     always re-add to the total the user typed. */
  const dividend = round2(total - salaryGross);
  const employerCost = round2((salaryGross * Math.max(employerCostPercent, 0)) / 100);
  const salaryCost = round2(salaryGross + employerCost);

  /* Profit before any of this compensation. `expenses` is already payroll-free
     — payroll is never recorded in the ledger — so nothing is double-counted. */
  const profitBeforeComp = round2(income - expenses);

  const netIncome = round2(profitBeforeComp - salaryCost);
  const corporateTax = taxOn(netIncome, corpTaxRate);
  const corporateTaxWithoutComp = taxOn(profitBeforeComp, corpTaxRate);

  /* What the dividend can actually be paid from. A dividend isn't a promise —
     it comes out of profit that has already borne corporate tax. */
  const afterTaxProfit = round2(netIncome - corporateTax);

  const personalOnSalary = round2((salaryGross * Math.max(personalSalaryRate, 0)) / 100);
  const personalOnDividend = round2((dividend * Math.max(personalDividendRate, 0)) / 100);
  const personalTax = round2(personalOnSalary + personalOnDividend);
  const combinedTax = round2(corporateTax + personalTax);

  /* Past this point the corporation's profit is already nil, so corporate tax
     is floored at zero and another dollar of salary offsets nothing further.
     Surfaced rather than left implicit: a number that silently stops moving
     reads as a bug, and worse, as a reason to keep raising the salary. */
  const breakEvenSalaryCost = Math.max(profitBeforeComp, 0);

  return {
    salaryGross,
    dividend,
    employerCost,
    salaryCost,
    profitBeforeComp,
    netIncome,
    corporateTax,
    corporateTaxWithoutComp,
    corporateTaxOffset: round2(corporateTaxWithoutComp - corporateTax),
    afterTaxProfit,
    personalOnSalary,
    personalOnDividend,
    personalTax,
    combinedTax,
    netToRecipient: round2(total - personalTax),
    setAsideTarget: round2(Math.max(hstPayable, 0) + corporateTax),
    breakEvenSalaryCost,
    pastBreakEven: salaryCost >= breakEvenSalaryCost,
    /* A dividend larger than the profit left after tax can't be declared. Not a
       rounding nicety — it's the difference between a plan and a fiction. */
    dividendFunded: dividend <= afterTaxProfit,
    dividendShortfall: round2(Math.max(dividend - afterTaxProfit, 0)),
  };
};

/**
 * The split with the lowest combined (corporate + personal) tax.
 *
 * Found by scanning every whole percentage rather than solving analytically.
 * The combined-tax curve is piecewise — it kinks where corporate tax hits its
 * zero floor and again where the dividend stops being fundable — so a closed
 * form would be fiddly and easy to get subtly wrong at exactly those joins.
 * 101 iterations of arithmetic is nothing, and it can't miss a kink.
 *
 * Splits whose dividend can't actually be funded are skipped: recommending a
 * mix that can't legally be paid would be worse than recommending nothing.
 * Returns null when no split is fundable.
 */
export const findOptimalSalaryShare = (
  input: CompensationScenarioInput,
): number | null => {
  let best: number | null = null;
  let bestTax = Infinity;

  for (let share = 0; share <= 100; share += 1) {
    const scenario = computeCompensationScenario({
      ...input,
      salarySharePercent: share,
    });
    if (!scenario.dividendFunded) continue;
    if (scenario.combinedTax < bestTax) {
      bestTax = scenario.combinedTax;
      best = share;
    }
  }

  return best;
};

/** Corporate tax never goes negative — a loss year owes nothing, not a refund. */
const taxOn = (amount: number, ratePercent: number): number =>
  round2((Math.max(amount, 0) * Math.max(ratePercent, 0)) / 100);

const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(Number.isFinite(n) ? n : min, min), max);
