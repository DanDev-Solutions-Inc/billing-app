import { CurrencyCode } from "@typings/CurrencyCode";

/**
 * USD→CAD rate applied to new USD documents.
 *
 * Stored on the document at creation (invoices.exchange_rate), so reporting is
 * stable: an invoice raised at this rate keeps converting at it, and moving this
 * constant never restates past revenue. Update it when the rate drifts enough to
 * matter; existing rows are unaffected by design.
 */
export const USD_TO_CAD = 1.37;

export const rateFor = (currency: CurrencyCode): number =>
  currency === "USD" ? USD_TO_CAD : 1;

/** A row's value in CAD — the reporting currency. */
export const toCad = (amount: number, exchangeRate: number): number =>
  amount * (Number(exchangeRate) || 1);

export interface CadTotal {
  /** Everything converted to CAD — the reporting figure. */
  cad: number;
  /** Foreign amounts in their own currency, for the "includes …" note. */
  foreign: Partial<Record<CurrencyCode, number>>;
}

/**
 * Total a mixed-currency set in CAD, keeping the foreign amounts alongside.
 *
 * Adding a USD total to a CAD one gives a number that means nothing, so
 * everything converts at the rate stored on its own row. The foreign amounts
 * are kept so the UI can say what's inside the figure rather than hiding it.
 */
export const sumInCad = (
  rows: { total: number | string; currency: CurrencyCode; exchange_rate: number | string }[],
): CadTotal => {
  const out: CadTotal = { cad: 0, foreign: {} };
  for (const r of rows) {
    const amount = Number(r.total) || 0;
    out.cad += toCad(amount, Number(r.exchange_rate));
    if (r.currency !== "CAD")
      out.foreign[r.currency] = (out.foreign[r.currency] ?? 0) + amount;
  }
  return out;
};
