import { Metadata } from "next";
import Image from "next/image";
import { getUserOrRedirect } from "@lib/dal";
import { PasswordForm } from "@components/password-form";

export const metadata: Metadata = { title: "Set a new password" };

/**
 * Where the recovery link lands after /auth/callback establishes the session.
 * Protected (not a public prefix) precisely so the now-signed-in user isn't
 * bounced to the dashboard before setting a new password. Its own centered
 * layout — it sits outside the app shell and the auth group.
 */
const ResetPasswordPage = async () => {
  await getUserOrRedirect();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center">
          <Image
            src="/brand/DavdevSolutionsDark.png"
            alt="DanDev Solutions"
            width={1343}
            height={268}
            priority
            className="h-9 w-auto invert"
          />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-sm">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Set a new password
          </h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
          <PasswordForm submitLabel="Save password" redirectTo="/dashboard" />
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
