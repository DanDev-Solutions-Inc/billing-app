const UNITS = ["B", "KB", "MB", "GB", "TB"];

/**
 * Human file size, e.g. 2411724 → "2.3 MB".
 *
 * Binary units (1024) with the familiar labels — what every file manager the
 * user has ever opened reports, so a figure here matches what their desktop
 * says about the same file.
 */
export const formatBytes = (bytes: number | null | undefined): string => {
  const n = Number(bytes) || 0;
  if (n <= 0) return "0 B";
  const exp = Math.min(Math.floor(Math.log(n) / Math.log(1024)), UNITS.length - 1);
  const value = n / Math.pow(1024, exp);
  /* No decimal on bytes — "512.0 B" is noise — and one everywhere above it. */
  return `${exp === 0 ? value : value.toFixed(1)} ${UNITS[exp]}`;
};
