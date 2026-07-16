import { Metadata } from "next";
import { AuthForm } from "@components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

const LoginPage = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-black">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-muted">
        Sign in to manage your invoices and receipts.
      </p>
    </div>
    <AuthForm mode="login" />
  </div>
);

export default LoginPage;
