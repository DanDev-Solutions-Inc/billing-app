import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { CurrencyCode } from "@typings/CurrencyCode";
import { BUSINESS } from "@utils/constants";
import { toCurrency } from "@utils/currency";

/* Both render "$", so USD is suffixed to keep the two tellable apart — an
   invoice reading "$1,234.50" shouldn't be ambiguous about which dollar. */
const FORMATTERS: Record<CurrencyCode, Intl.NumberFormat> = {
  CAD: new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
};

/**
 * Format money, e.g. 1234.5 → "$1,234.50" (CAD) or "$1,234.50 USD".
 * Defaults to CAD — the currency everything predating this was billed in.
 */
export const formatMoney = (
  value: number | string | null | undefined,
  currency?: CurrencyCode | null,
): string => {
  /* Normalised rather than defaulted: a `= "CAD"` parameter only covers
     undefined, so an explicit null — or a row written before the column
     existed — would index FORMATTERS with junk and throw. */
  const code = toCurrency(currency);
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  const formatted = FORMATTERS[code].format(Number.isFinite(n) ? n : 0);
  return code === "USD" ? `${formatted} USD` : formatted;
};

/** Format an ISO date (yyyy-mm-dd) as a readable date, e.g. "Jul 16, 2026". */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * An instant, not a business date — so unlike formatDate it keeps the time.
 * Used for email delivery events, where "opened at 2:14 p.m." is the point.
 */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Split a tax-*inclusive* amount into its subtotal and tax parts.
 *
 * Receipts and transactions store one gross number — what was actually paid,
 * tax and all (see the analyze-receipt prompt). This backs the tax out of it
 * rather than adding to it, so the total never moves: a $113.00 receipt is
 * $100.00 + $13.00, still $113.00.
 *
 * Tax is derived from the *rounded* subtotal so the two parts always re-add to
 * the gross exactly — the display can never show a breakdown that doesn't sum.
 * (computeTotals rounds the other way round, which is right for that direction:
 * there the line items are the source of truth and the total is derived.)
 *
 * A zero/negative rate means no tax applies: subtotal is the whole amount.
 */
export const splitTaxInclusive = (
  gross: number | string | null | undefined,
  taxRatePercent: number = BUSINESS.taxRate,
): { subtotal: number; tax: number; total: number } => {
  const n = typeof gross === "string" ? parseFloat(gross) : (gross ?? 0);
  const total = round2(Number.isFinite(n) ? n : 0);
  const rate = Number(taxRatePercent) || 0;
  if (rate <= 0) return { subtotal: total, tax: 0, total };
  const subtotal = round2(total / (1 + rate / 100));
  return { subtotal, tax: round2(total - subtotal), total };
};

/** Compute subtotal / tax / total from line items and a tax rate (percent). */
export const computeTotals = (
  items: LineItemFormValues[],
  taxRatePercent = 0,
): { subtotal: number; tax: number; total: number } => {
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0,
  );
  const tax = round2((subtotal * (Number(taxRatePercent) || 0)) / 100);
  return { subtotal: round2(subtotal), tax, total: round2(subtotal + tax) };
};
