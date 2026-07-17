import { CurrencyCode } from "@typings/CurrencyCode";
import { BUSINESS } from "@utils/constants";

export const CURRENCIES: CurrencyCode[] = ["CAD", "USD"];

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
