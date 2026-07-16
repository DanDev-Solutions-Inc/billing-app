import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

const currency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

/** Format a number as CAD currency, e.g. 1234.5 → "$1,234.50". */
export const formatMoney = (
  value: number | string | null | undefined,
): string => {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return currency.format(Number.isFinite(n) ? n : 0);
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

export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

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
