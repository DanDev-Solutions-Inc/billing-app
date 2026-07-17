import { Metadata } from "next";
import { AuthForm } from "@components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

// Messages for the ?error= a redirect can arrive with.
const ERRORS: Record<string, string> = {
  "no-access":
    "Your access to this account has been removed. Contact the account owner if you think this is a mistake.",
  oauth: "Sign-in with Google didn't complete. Please try again.",
  confirm: "That confirmation link is invalid or has expired.",
};

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) => {
  const { error } = await searchParams;
  const message = error ? ERRORS[error] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage your invoices and receipts.
        </p>
      </div>
      {message && (
        <p className="rounded-lg bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
          {message}
        </p>
      )}
      <AuthForm mode="login" />
    </div>
  );
};

export default LoginPage;
