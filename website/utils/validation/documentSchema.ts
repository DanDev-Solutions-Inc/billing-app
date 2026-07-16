import * as Yup from "yup";

export const documentSchema = Yup.object({
  customer_id: Yup.string(),
  number: Yup.string(),
  issue_date: Yup.string().required("Issue date is required"),
  second_date: Yup.string(),
  notes: Yup.string(),
  tax_rate: Yup.number().min(0, "Tax rate cannot be negative"),
  items: Yup.array()
    .of(
      Yup.object({
        description: Yup.string(),
        quantity: Yup.number().min(0, "Qty cannot be negative"),
        unit_price: Yup.number().min(0, "Price cannot be negative"),
      }),
    )
    .test(
      "has-line-item",
      "Add at least one line item with a description",
      (items) =>
        Array.isArray(items) &&
        items.some((it) => (it?.description ?? "").trim().length > 0),
    ),
});
