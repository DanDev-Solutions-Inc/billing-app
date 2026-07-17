import * as Yup from "yup";

/** New-password form: length rule plus a confirmation that must match. */
export const passwordSchema = Yup.object({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirm: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords don't match")
    .required("Confirm your password"),
});
