import { parseDay } from "@utils/period";

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
