import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getProfile } from "@services/supabase/profile";
import { PageHeader, Card } from "@components/ui";
import { CopyField } from "@components/copy-field";
import { WaveSync } from "@components/wave/wave-sync";
import { BUSINESS } from "@utils/constants";

export const metadata: Metadata = { title: "Settings" };

const SettingsPage = async () => {
  const user = await getUserOrRedirect();
  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);

  const inboundDomain = process.env.INBOUND_DOMAIN ?? "inbound.dandev.solutions";
  const friendlyAddress =
    process.env.RECEIPTS_EMAIL ?? "receipts@dandev.solutions";
  const inboundAddress = profile
    ? `receipts+${profile.inbound_token}@${inboundDomain}`
    : null;

  return (
    <>
      <PageHeader title="Settings" subtitle="Account and email-in details." />

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="mb-4 font-heading text-base font-semibold text-brand-black">
            Import from Wave
          </h2>
          <WaveSync />
        </Card>

        <Card className="p-6">
          <h2 className="font-heading text-base font-semibold text-brand-black">
            Email a receipt
          </h2>
          <p className="mt-1 text-sm text-muted">
            Send or forward a receipt (with the image attached) from your
            account email to the address below — it is imported automatically and
            appears under Receipts.
          </p>
          <div className="mt-4">
            <CopyField value={friendlyAddress} />
            <p className="mt-2 text-xs text-muted">
              Works from your sign-in email. Forwarding from a different address?
              Use your personal alias instead:
            </p>
            <div className="mt-2">
              {inboundAddress ? (
                <CopyField value={inboundAddress} />
              ) : (
                <p className="text-sm text-brand-red">
                  Your personal alias is not ready yet — run the database
                  migrations, then reload.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-heading text-base font-semibold text-brand-black">
            Account
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Signed in as
              </dt>
              <dd className="mt-0.5 text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Business
              </dt>
              <dd className="mt-0.5 text-foreground">{BUSINESS.name}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
};

export default SettingsPage;
