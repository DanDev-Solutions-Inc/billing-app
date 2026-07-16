import { Customer } from "@typings/customer/Customer";
import { RecurringFormState } from "@app/(app)/recurring/actions";

export interface RecurringInvoiceFormProps {
  customers: Customer[];
  action: (
    prev: RecurringFormState,
    formData: FormData,
  ) => Promise<RecurringFormState>;
}
