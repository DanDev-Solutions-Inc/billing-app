/**
 * Build a Content-Disposition header that survives real filenames.
 *
 * A quote or newline in the plain `filename=` would end the value early — at
 * best a truncated download name, at worst a header the client rejects — so it
 * is stripped to ASCII. The RFC 5987 `filename*` carries the real name,
 * accents and all, for every browser in current use; the plain one is the
 * fallback nothing modern actually reads.
 */
export const attachment = (filename: string): string => {
  const ascii = filename.replace(/["\\\r\n]/g, "").replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};
