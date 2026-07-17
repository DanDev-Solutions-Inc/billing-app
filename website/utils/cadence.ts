import { RecurringFrequency } from "@typings/recurring-invoice/RecurringFrequency";

/* Dates live in @utils/date — re-exported so cadence callers don't need to know
   that. The copy here wasn't timezone-corrected and drifted from the form's. */
export { addDays } from "@utils/date";

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

/** Human summary, e.g. "Every 2 weeks" or "Every month". */
export const cadenceLabel = (
  frequency: RecurringFrequency,
  interval: number,
): string => {
  const unit = FREQUENCY_LABELS[frequency];
  return interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`;
};

/** Given a run date (yyyy-mm-dd), frequency, and interval, return the next run. */
export const computeNextRun = (
  from: string,
  frequency: RecurringFrequency,
  interval: number,
): string => {
  const d = new Date(`${from}T00:00:00`);
  const n = Math.max(1, Math.floor(interval) || 1);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + n);
      break;
    case "weekly":
      d.setDate(d.getDate() + n * 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + n);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + n);
      break;
  }
  return d.toISOString().slice(0, 10);
};


/**
 * Invoices per year at interval 1, so schedules on different cadences can be
 * summed into one comparable figure.
 *
 * Annual rather than monthly on purpose: a weekly schedule bills 52×, which is
 * 4.33 months' worth — a "per month" figure is an average no month ever
 * actually matches ($621.50/week reads as $2,693.17/mo, but you bill 4 or 5
 * weeks, never 4.33).
 *
 * Typed to RecurringFrequency, not Record<string, number>: a new frequency then
 * fails to compile rather than yielding undefined and turning the total to NaN.
 */
export const YEARLY_FACTOR: Record<RecurringFrequency, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  yearly: 1,
};

/** What one schedule bills per year, in its own currency. */
export const yearlyAmount = (schedule: {
  frequency: RecurringFrequency;
  interval: number;
  total: number;
}): number =>
  (schedule.total * YEARLY_FACTOR[schedule.frequency]) /
  Math.max(1, schedule.interval);
