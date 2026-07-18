export interface ReceiptPreviewProps {
  /** The receipt file route, e.g. `/api/receipts/{id}/file`. */
  src: string;
  /** Describes the file — used as the alt text and the lightbox heading. */
  alt: string;
  /** PDFs need an <object>; an <img> renders nothing for them. */
  isPdf: boolean;
  /** Height/sizing for the inline preview; the lightbox is always full-bleed. */
  previewClassName?: string;
}
