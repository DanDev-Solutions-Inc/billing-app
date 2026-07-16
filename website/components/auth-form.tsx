"use client";

import Link from "next/link";
import { useFormik } from "formik";
import { login, signup, signInWithGoogle } from "@app/(auth)/actions";
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

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={() => signInWithGoogle()}
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.85 9.9C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        Continue with Google
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
