import * as Yup from "yup";

export const inviteSchema = Yup.object({
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
  role: Yup.string().oneOf(["viewer", "editor"]).required(),
});
