import { Customer } from "@typings/customer/Customer";

/** A customer plus its billing totals, joined for the list table. */
export interface CustomerRow extends Customer {
  invoice_count: number;
  total_billed: number;
  total_paid: number;
  /** Non-CAD billing in its own currency — null for CAD-only customers. */
  total_billed_foreign: number | null;
}
