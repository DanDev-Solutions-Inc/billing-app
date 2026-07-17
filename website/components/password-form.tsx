"use client";

import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { inputClass } from "@components/ui";
import { updatePassword } from "@app/(auth)/actions";
import { passwordSchema } from "@utils/validation/passwordSchema";
import { PasswordFormValues } from "@interfaces/forms/PasswordFormValues";

const initialValues: PasswordFormValues = { password: "", confirm: "" };

/**
 * Set a new password. Shared by Settings (change while signed in) and the
 * recovery page (the reset link already established the session). On success it
 * either redirects (recovery → into the app) or clears the fields and shows a
 * confirmation (settings, staying put).
 */
export const PasswordForm = ({
  submitLabel = "Update password",
  redirectTo,
}: {
  submitLabel?: string;
  redirectTo?: string;
}) => {
  const router = useRouter();

  const formik = useFormik<PasswordFormValues>({
    initialValues,
    validationSchema: passwordSchema,
    onSubmit: async (values, { setStatus, resetForm }) => {
      const formData = new FormData();
      formData.set("password", values.password);
      const result = await updatePassword({}, formData);
      if (result?.error) {
        setStatus({ error: result.error });
        return;
      }
      if (redirectTo) {
        router.replace(redirectTo);
        router.refresh();
        return;
      }
      resetForm();
      setStatus({ message: result?.message ?? "Password updated." });
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
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={inputClass}
          placeholder="••••••••"
        />
        {formik.touched.password && formik.errors.password && (
          <p className="text-xs text-brand-red">{formik.errors.password}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-medium text-foreground">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={formik.values.confirm}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={inputClass}
          placeholder="••••••••"
        />
        {formik.touched.confirm && formik.errors.confirm && (
          <p className="text-xs text-brand-red">{formik.errors.confirm}</p>
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
        {formik.isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
};
