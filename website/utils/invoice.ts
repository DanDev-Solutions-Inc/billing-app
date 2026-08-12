import { parseDay } from "@utils/period";
import { round2 } from "@utils/money";
import { CurrencyCode } from "@typings/CurrencyCode";

/** The shape of an invoice as far as money-owed is concerned. */
interface Payable {
  status: string;
  total: number | string;
  amount_paid: number | string;
}

/**
 * "Overdue" is not a stored status — `invoice_status` is only
 * draft | sent | paid. It's derived: still unpaid, and past its due date.
 */
export const isOverdue = (inv: {
  status: string;
  due_date: string | null;
}): boolean => {
  if (inv.status !== "sent" || !inv.due_date) return false;
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return parseDay(inv.due_date) < startOfToday;
};

/** Unpaid: sent but not yet paid. Overdue is a subset of this. */
export const isOutstanding = (inv: { status: string }): boolean =>
  inv.status === "sent";

/** Still owed on this invoice, in its own currency. Never below zero. */
export const balanceOf = (inv: Payable): number =>
  Math.max(0, round2(Number(inv.total) - Number(inv.amount_paid)));

/** Money received so far, in the invoice's own currency. */
export const paidOf = (inv: Payable): number => Number(inv.amount_paid) || 0;

/**
 * How the invoice reads, which is not always what `status` stores.
 *
 * "partial" joins "overdue" as a derived label: the enum is draft | sent | paid,
 * and a sent invoice with some of the money in is neither of the two things
 * those words mean. Overdue still wins when both apply — a late part-payment is
 * a chase, not a milestone.
 */
export const paymentStatus = (
  inv: Payable & { due_date: string | null },
): string => {
  if (isOverdue(inv)) return "overdue";
  if (inv.status === "sent" && paidOf(inv) > 0) return "partial";
  return inv.status;
};

/**
 * The invoice restated as "what's left", for the CAD sums on the dashboard.
 *
 * sumInCad reads `total`, and outstanding means the balance — a $10,000 invoice
 * with $9,000 in should add $1,000 to the figure being chased, not $10,000.
 */
export const asBalanceRow = <
  T extends Payable & { currency: CurrencyCode; exchange_rate: number | string },
>(
  inv: T,
): T => ({ ...inv, total: balanceOf(inv) });
