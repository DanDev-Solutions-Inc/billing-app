export interface TaxBreakdownProps {
  /** The gross, tax-inclusive amount as stored on the receipt/transaction. */
  amount: number | string | null | undefined;
  /** False for zero-rated/exempt money — nothing to back out. */
  taxIncluded: boolean;
  /**
   * Pass false where the page already shows the gross figure as its hero — the
   * breakdown then explains that number instead of repeating it underneath.
   */
  showTotal?: boolean;
}
