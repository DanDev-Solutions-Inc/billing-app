import * as Yup from "yup";

export const receiptSchema = Yup.object({
  vendor: Yup.string(),
  amount: Yup.number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Enter a valid amount")
    .min(0, "Amount cannot be negative"),
  receipt_date: Yup.string().required("Date is required"),
  category: Yup.string(),
  notes: Yup.string(),
  as_expense: Yup.boolean(),
});
