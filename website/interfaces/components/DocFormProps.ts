import { Customer } from "@typings/customer/Customer";
import { CurrencyCode } from "@typings/CurrencyCode";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { DocFormState } from "@interfaces/forms/DocFormState";

export interface DocFormProps {
  kind: "invoice" | "estimate";
  customers: Customer[];
  action: (prev: DocFormState, formData: FormData) => Promise<DocFormState>;
  submitLabel?: string;
  defaults?: {
    currency?: CurrencyCode;
    customerId?: string | null;
    number?: string | null;
    issueDate?: string;
    secondDate?: string | null;
    notes?: string | null;
    items?: LineItemFormValues[];
    taxRate?: number;
  };
}
