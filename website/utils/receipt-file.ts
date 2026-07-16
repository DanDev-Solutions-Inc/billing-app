/** True when a receipt's stored file is a PDF (can't go through next/image). */
export const isPdfReceipt = (url: string | null | undefined): boolean =>
  Boolean(url && url.toLowerCase().split("?")[0].endsWith(".pdf"));
