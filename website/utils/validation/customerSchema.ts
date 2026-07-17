import * as Yup from "yup";

export const customerSchema = Yup.object({
  name: Yup.string().trim().required("Name is required"),
  email: Yup.string().email("Enter a valid email address"),
  phone: Yup.string(),
  address_line1: Yup.string(),
  address_line2: Yup.string(),
  city: Yup.string(),
  province: Yup.string(),
  postal_code: Yup.string(),
  country: Yup.string(),
  secondary_emails: Yup.array().of(
    Yup.string().email("Enter a valid email address"),
  ),
});
