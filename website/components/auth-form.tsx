"use client";

import Link from "next/link";
import { useFormik } from "formik";
import { login, signup } from "@app/(auth)/actions";
import { credentialsSchema } from "@utils/validation/credentialsSchema";
import { CredentialsFormValues } from "@interfaces/forms/CredentialsFormValues";

const initialValues: CredentialsFormValues = { email: "", password: "" };

export const AuthForm = ({ mode }: { mode: "login" | "signup" }) => {
  const action = mode === "login" ? login : signup;

  const formik = useFormik<CredentialsFormValues>({
    initialValues,
    validationSchema: credentialsSchema,
    onSubmit: async (values, { setStatus }) => {
      const formData = new FormData();
      formData.set("email", values.email);
      formData.set("password", values.password);
      const result = await action({}, formData);
      if (result?.error) setStatus({ error: result.error });
      else if (result?.message) setStatus({ message: result.message });
    },
  });

  const status = formik.status as
    | { error?: string; message?: string }
    | undefined;

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
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
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
          placeholder="you@dandev.solutions"
        />
        {formik.touched.email && formik.errors.email && (
          <p className="text-xs text-brand-red">{formik.errors.email}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
          placeholder="••••••••"
        />
        {formik.touched.password && formik.errors.password && (
          <p className="text-xs text-brand-red">{formik.errors.password}</p>
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
        className="mt-1 rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
      >
        {formik.isSubmitting
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="font-medium text-brand-accent hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-accent hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
};
