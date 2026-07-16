import { Customer } from "@typings/customer/Customer";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { DocFormState } from "@components/doc-form";

export interface DocFormProps {
  kind: "invoice" | "estimate";
  customers: Customer[];
  action: (prev: DocFormState, formData: FormData) => Promise<DocFormState>;
  defaults?: {
    customerId?: string | null;
    number?: string | null;
    issueDate?: string;
    secondDate?: string | null;
    notes?: string | null;
    items?: LineItemFormValues[];
    taxRate?: number;
  };
}
