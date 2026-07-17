import { CurrencyCode } from "@typings/CurrencyCode";
import { BUSINESS } from "@utils/constants";

export const CURRENCIES: CurrencyCode[] = ["CAD", "USD"];

/**
 * Coerce anything to a currency, defaulting to CAD.
 *
 * CAD is the default everywhere — it's what the business bills in, and it's the
 * one that charges HST, so a missing or unrecognised value can never silently
 * drop the tax. Use this wherever a currency arrives untyped: form posts, casts,
 * or rows written before the column existed.
 */
export const toCurrency = (value: unknown): CurrencyCode =>
  value === "USD" ? "USD" : "CAD";

/**
 * Tax rate for a currency.
 *
 * DanDev only charges HST on Canadian work; US work is billed in USD with no
 * tax. Currency therefore decides the rate — it isn't a free choice, so this is
 * the single place that rule lives.
 */
export const taxRateFor = (currency: CurrencyCode): number =>
  currency === "USD" ? 0 : BUSINESS.taxRate;

/** USD invoices don't carry tax, so there's no rate to choose. */
export const chargesTax = (currency: CurrencyCode): boolean =>
  currency !== "USD";
