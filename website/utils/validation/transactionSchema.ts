import * as Yup from "yup";

export const transactionSchema = Yup.object({
  direction: Yup.string()
    .oneOf(["income", "expense"], "Choose income or expense")
    .required(),
  amount: Yup.number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Enter a valid amount")
    .moreThan(0, "Amount must be greater than zero")
    .required("Amount is required"),
  txn_date: Yup.string().required("Date is required"),
  category: Yup.string(),
  description: Yup.string(),
});
