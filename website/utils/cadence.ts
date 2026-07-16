import { RecurringFrequency } from "@typings/recurring-invoice/RecurringFrequency";

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

/** Add N days to a yyyy-mm-dd date. */
export const addDays = (from: string, days: number): string => {
  const d = new Date(`${from}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
