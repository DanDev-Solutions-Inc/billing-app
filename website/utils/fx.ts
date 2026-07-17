import { CurrencyCode } from "@typings/CurrencyCode";
import { toCurrency } from "@utils/currency";

/**
 * Fallback USD→CAD, used only when the Bank of Canada lookup is unreachable.
 *
 * Not the normal path: services/fx/boc-rate.ts fetches the official rate for the
 * document's date and stamps it on the row. A constant is always stale — this
 * one was 1.37 while the real rate was 1.4038 — which matters most for rare
 * invoices, since each one lands further from whenever the number was written.
 *
 * A slightly-off rate beats a failed invoice, and the stored value can be
 * corrected afterwards.
 */
export const USD_TO_CAD = 1.37;

export const rateFor = (currency: CurrencyCode | null | undefined): number =>
  toCurrency(currency) === "USD" ? USD_TO_CAD : 1;

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
    const code = toCurrency(r.currency);
    if (code !== "CAD") out.foreign[code] = (out.foreign[code] ?? 0) + amount;
  }
  return out;
};
