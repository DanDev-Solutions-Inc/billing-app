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
            Forward or send a receipt (with the image attached) to your personal
            address below. It is imported automatically and appears under
            Receipts.
          </p>
          <div className="mt-4">
            {inboundAddress ? (
              <CopyField value={inboundAddress} />
            ) : (
              <p className="text-sm text-brand-red">
                Your inbound address is not ready yet. Run the database schema,
                then reload.
              </p>
            )}
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
