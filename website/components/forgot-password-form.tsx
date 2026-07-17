"use client";

import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { inputClass } from "@components/ui";
import { requestPasswordReset } from "@app/(auth)/actions";

const schema = Yup.object({
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
});

/** Request a reset link. Always reports the same "check your inbox" message,
 *  whether or not the address has an account — see the action. */
export const ForgotPasswordForm = () => {
  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: schema,
    onSubmit: async (values, { setStatus }) => {
      const formData = new FormData();
      formData.set("email", values.email);
      const result = await requestPasswordReset({}, formData);
      if (result?.error) setStatus({ error: result.error });
      else setStatus({ message: result?.message });
    },
  });

  const status = formik.status as
    | { error?: string; message?: string }
    | undefined;

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={inputClass}
          placeholder="you@dandev.solutions"
        />
        {formik.touched.email && formik.errors.email && (
          <p className="text-xs text-brand-red">{formik.errors.email}</p>
        )}
      </div>

      {status?.error && (
        <p className="rounded-lg bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
          {status.error}
        </p>
      )}
      {status?.message && (
        <p className="rounded-lg bg-brand-green/10 px-3 py-2 text-sm text-brand-green">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={formik.isSubmitting}
        className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        {formik.isSubmitting ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
};
