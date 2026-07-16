import { RecurringInvoice } from "@typings/recurring-invoice/RecurringInvoice";
import { Customer } from "@typings/customer/Customer";

export interface RecurringInvoiceWithCustomer extends RecurringInvoice {
  customers: Customer | null;
}
