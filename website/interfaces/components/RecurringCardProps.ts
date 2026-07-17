import { RecurringInvoiceWithCustomer } from "@interfaces/models/recurring-invoice/RecurringInvoiceWithCustomer";

/** A live schedule plus the amount it bills each run. */
export type UpcomingSchedule = RecurringInvoiceWithCustomer & { total: number };

export interface RecurringCardProps {
  /** What the live schedules bill in a year, in CAD. */
  yearlyRun: number;
  /** Active schedules, soonest first. */
  upcoming: UpcomingSchedule[];
}
