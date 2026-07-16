import { Estimate } from "@typings/estimate/Estimate";
import { Customer } from "@typings/customer/Customer";

export interface EstimateWithCustomer extends Estimate {
  customers: Customer | null;
}
