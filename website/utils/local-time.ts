/**
 * Helpers for <input type="datetime-local">, which speaks the user's wall clock
 * and knows nothing about timezones.
 *
 * These only make sense on the client: the value they read and write is local
 * time, and the server (Vercel, UTC) has a different idea of what that is.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** Now, as the "YYYY-MM-DDTHH:mm" a datetime-local input expects. */
export const localNow = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * A datetime-local value as an absolute instant.
 *
 * `new Date("2026-08-12T21:30")` is parsed in the browser's zone, so the ISO
 * string that comes back carries the offset the user meant — 9:30 p.m. in
 * Toronto, not 9:30 p.m. UTC.
 */
export const toIsoInstant = (value: string): string => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

/** The calendar date of a datetime-local value, in the user's own zone. */
export const localDay = (value: string): string => value.slice(0, 10);
