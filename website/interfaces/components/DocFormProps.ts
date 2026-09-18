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
    /** Days from issue to due/expiry, used when no secondDate is given — lets a
        duplicate keep its source's terms against a fresh issue date. */
    termDays?: number;
    notes?: string | null;
    items?: LineItemFormValues[];
    taxRate?: number;
  };
}
