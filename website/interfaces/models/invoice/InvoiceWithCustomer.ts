import { Invoice } from "@typings/invoice/Invoice";
import { Customer } from "@typings/customer/Customer";

export interface InvoiceWithCustomer extends Invoice {
  customers: Customer | null;
}
