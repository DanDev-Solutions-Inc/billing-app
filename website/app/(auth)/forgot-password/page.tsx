import { Metadata } from "next";
import { ForgotPasswordForm } from "@components/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

const ForgotPasswordPage = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        Reset your password
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a link to choose a new
        password.
      </p>
    </div>
    <ForgotPasswordForm />
  </div>
);

export default ForgotPasswordPage;
