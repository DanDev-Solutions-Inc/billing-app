import { CadTotal } from "@utils/fx";
import { InvoiceWithCustomer } from "@interfaces/models/invoice/InvoiceWithCustomer";

export interface OutstandingCardProps {
  /** Unpaid total in CAD, with any foreign amounts alongside. */
  outstanding: CadTotal;
  outstandingInvoices: InvoiceWithCustomer[];
  overdue: CadTotal;
  overdueInvoices: InvoiceWithCustomer[];
  /** Overdue first — those are the ones that need chasing. */
  outstandingSorted: InvoiceWithCustomer[];
}
