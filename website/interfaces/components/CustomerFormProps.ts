import { Customer } from "@typings/customer/Customer";

export interface CustomerFormProps {
  /** Present = edit that customer; absent = create a new one. */
  customer?: Customer;
  onSuccess?: () => void;
}
