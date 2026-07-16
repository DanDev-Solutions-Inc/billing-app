import { Metadata } from "next";
import { getUserOrRedirect } from "@lib/dal";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@components/ui";
import { CopyField } from "@components/copy-field";
import { WaveSync } from "@components/wave/wave-sync";
import { BUSINESS } from "@utils/constants";

export const metadata: Metadata = { title: "Settings" };

const SettingsPage = async () => {
  const user = await getUserOrRedirect();

  const friendlyAddress =
    process.env.RECEIPTS_EMAIL ?? "receipts@dandev.solutions";

  return (
    <>
      <PageHeader title="Settings" subtitle="Account and email-in details." />

      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import from Wave</CardTitle>
          </CardHeader>
          <CardContent>
            <WaveSync />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email a receipt</CardTitle>
            <CardDescription>
              Send or forward a receipt (with the image attached) from your
              account email to the address below — it is imported automatically
              and appears under Receipts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CopyField value={friendlyAddress} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Signed in as
                </dt>
                <dd className="mt-0.5 text-foreground">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Business
                </dt>
                <dd className="mt-0.5 text-foreground">{BUSINESS.name}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SettingsPage;
