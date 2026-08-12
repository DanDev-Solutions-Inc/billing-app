/** Result of recording a payment against an invoice. */
export interface PaymentState {
  error?: string;
  /** Confirmation to show on success, e.g. "Recorded $500.00." */
  ok?: string;
}
