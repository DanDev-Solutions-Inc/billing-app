import { formatDate } from "@utils/money";

/**
 * Calendar-date helpers (yyyy-mm-dd).
 *
 * Every date in this app is a *business* date — an invoice's issue date, a
 * receipt's date — not an instant. So they're computed in local time: after 8pm
 * in Toronto, `new Date().toISOString()` already reads as tomorrow, which would
 * file this evening's receipt under the wrong day.
 *
 * These live in one place because the codebase previously had two versions of
 * each, one tz-correct and one not, which quietly disagreed for four hours
 * every night.
 */

/** Local calendar date as yyyy-mm-dd. */
export const today = (): string => toIsoDate(new Date());

/** A Date's local calendar date as yyyy-mm-dd. */
export const toIsoDate = (d: Date): string => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

/** Add days to a yyyy-mm-dd date, staying on the local calendar. */
export const addDays = (from: string, days: number): string => {
  // Parsed as local midnight — `new Date("2026-07-16")` would be UTC midnight,
  // which is the previous day in any negative offset.
  const d = new Date(`${from}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
};

/** Whole days between two yyyy-mm-dd dates (to − from). */
export const daysBetween = (from: string, to: string): number =>
  Math.round(
    (new Date(`${to}T00:00:00`).getTime() -
      new Date(`${from}T00:00:00`).getTime()) /
      86_400_000,
  );

/** Whole days from today to a yyyy-mm-dd date; negative when it's past. */
export const daysUntil = (iso: string): number => daysBetween(today(), iso);

/**
 * A due date as a glanceable phrase — "Tomorrow" reads faster than a date you
 * have to compare against today. Falls back to the date itself once it's far
 * enough out that the relative form stops helping.
 */
export const dueLabel = (iso: string): string => {
  const days = daysUntil(iso);
  if (days < 0) return "Due now";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 14) return `In ${days} days`;
  return formatDate(iso);
};
