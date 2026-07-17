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

  // Mail for the inbound domain is routed to Resend → /api/inbound/receipts.
  // RECEIPTS_EMAIL overrides it if a friendlier alias is set up to forward there.
  const inboundDomain = process.env.INBOUND_DOMAIN;
  const friendlyAddress =
    process.env.RECEIPTS_EMAIL ??
    (inboundDomain ? `receipts@${inboundDomain}` : null);

  return (
    <>
      <PageHeader title="Settings" subtitle="Account and email-in details." />

      {/* [&>*]:min-w-0 — grid items default to `min-width: auto`, so a card
          can't shrink below its content's intrinsic width. The long inbound
          address then pushed every card past the screen on a phone instead of
          truncating inside it. */}
      <div className="grid max-w-3xl gap-6 [&>*]:min-w-0">
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
              {friendlyAddress ? (
                <>
                  Forward a receipt (image or PDF attached) from{" "}
                  <strong>{user.email}</strong> to the address below. It is read
                  automatically — vendor, amount, date, and category are filled
                  in, and a matching transaction is filed for review.
                </>
              ) : (
                <>
                  Not configured yet — set <code>INBOUND_DOMAIN</code> (and point
                  its MX records at Resend) to enable emailing receipts in.
                </>
              )}
            </CardDescription>
          </CardHeader>
          {friendlyAddress && (
            <CardContent>
              <CopyField value={friendlyAddress} />
            </CardContent>
          )}
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
