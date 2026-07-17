/** Result of emailing a document — shared by the invoice and estimate senders. */
export interface SendState {
  error?: string;
  /** Confirmation to show on success, e.g. "Sent to ap@acme.com." */
  ok?: string;
}
