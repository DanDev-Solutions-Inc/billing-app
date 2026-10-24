import { Invoice } from "@typings/invoice/Invoice";
import { CurrencyCode } from "@typings/CurrencyCode";
import { Page, SortDir } from "@utils/table";

export interface ScheduleInvoicesProps {
  /** Every invoice the schedule raised — the summary line counts all of them. */
  invoices: Invoice[];
  /** The sorted page of them the table shows. */
  result: Page<Invoice>;
  sort: string;
  dir: SortDir;
  sortHref: (key: string) => string;
  pageHref: (page: number) => string;
  currency: CurrencyCode;
  /** Whole run for a fixed-term schedule (raised + remaining); null if open-ended. */
  plannedCount: number | null;
}
