import * as Yup from "yup";

/** Editing an existing receipt — no `as_expense`, that's a create-time choice. */
export const receiptEditSchema = Yup.object({
  vendor: Yup.string(),
  amount: Yup.number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Enter a valid amount")
    .min(0, "Amount cannot be negative"),
  receipt_date: Yup.string().required("Date is required"),
  category: Yup.string(),
  notes: Yup.string(),
});
