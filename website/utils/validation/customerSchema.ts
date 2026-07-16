import * as Yup from "yup";

export const customerSchema = Yup.object({
  name: Yup.string().trim().required("Name is required"),
  email: Yup.string().email("Enter a valid email address"),
  phone: Yup.string(),
  address: Yup.string(),
});
