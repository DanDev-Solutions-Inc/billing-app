import * as Yup from "yup";

export const recurringSchema = Yup.object({
  frequency: Yup.string()
    .oneOf(["daily", "weekly", "monthly", "yearly"])
    .required("Choose a frequency"),
  interval: Yup.number().min(1, "At least 1").required("Required"),
  next_run: Yup.string().required("Choose a start date"),
  net_days: Yup.number().min(0, "Cannot be negative").required("Required"),
  items: Yup.array()
    .of(
      Yup.object({
        description: Yup.string(),
        quantity: Yup.number().min(0),
        unit_price: Yup.number().min(0),
      }),
    )
    .test("has-item", "Add at least one line item", (items) =>
      Boolean(items?.some((i) => i?.description && i.description.trim())),
    ),
});
