import { Customer } from "@typings/customer/Customer";
import { RecurringFormState } from "@interfaces/forms/RecurringFormState";

import { RecurringFormValues } from "@interfaces/forms/RecurringFormValues";

export interface RecurringInvoiceFormProps {
  /** Present = edit that schedule; absent = create a new one. */
  defaults?: RecurringFormValues;
  submitLabel?: string;
  customers: Customer[];
  action: (
    prev: RecurringFormState,
    formData: FormData,
  ) => Promise<RecurringFormState>;
}
