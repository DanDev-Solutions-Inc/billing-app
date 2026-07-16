import { Metadata } from "next";
import { AuthForm } from "@components/auth-form";

export const metadata: Metadata = { title: "Sign up" };

const SignupPage = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start tracking invoices, estimates, and expenses.
      </p>
    </div>
    <AuthForm mode="signup" />
  </div>
);

export default SignupPage;
