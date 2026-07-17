import { InvoiceStatus } from "@typings/invoice/InvoiceStatus";

export interface InvoiceStatusSelectProps {
  id: string;
  status: InvoiceStatus;
  /** Unpaid and past its due date — shown as "overdue" though the value is "sent". */
  overdue: boolean;
}
