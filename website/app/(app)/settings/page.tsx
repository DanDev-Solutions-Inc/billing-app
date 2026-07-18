import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect, isOwner } from "@lib/dal";
import { listGrants } from "@services/supabase/profile-access";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatusPill,
  FilterTabs,
} from "@components/ui";
import { CopyField } from "@components/copy-field";
import { WaveSync } from "@components/wave/wave-sync";
import { PasswordForm } from "@components/password-form";
import { TeamInviteForm } from "@components/team-invite-form";
import { removeMemberAction } from "./team-actions";
import { BUSINESS } from "@utils/constants";

export const metadata: Metadata = { title: "Settings" };

/* Settings grew past the point where one scroll of cards reads as a list of
   unrelated things. Sections are URL state (?tab=) rather than client state:
   linkable, back-button friendly, and a Server Action that revalidates the
   page comes back to the same section instead of resetting to the first. */
const TABS = ["account", "team", "import"] as const;
type SettingsTab = (typeof TABS)[number];

const TAB_META: Record<SettingsTab, { label: string; subtitle: string }> = {
  account: { label: "Account", subtitle: "Your profile and sign-in details." },
  team: { label: "Team", subtitle: "Who else can see this account's data." },
  import: {
    label: "Import",
    subtitle: "Ways to get receipts and books into the app.",
  },
};

const SettingsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) => {
  const { tab } = await searchParams;
  const active: SettingsTab = TABS.includes(tab as SettingsTab)
    ? (tab as SettingsTab)
    : "account";

  const user = await getUserOrRedirect();

  // Only the Team tab renders the grants, so only it pays for the query.
  const grants =
    active === "team" ? await listGrants(await createClient()) : [];

  // The Wave import and team management both write on the owner's behalf, so
  // only the owner sees them — matching the server-side guards in the actions.
  const owner = isOwner(user.email);

  const tabs = TABS.map((t) => ({
    key: t,
    label: TAB_META[t].label,
    // "account" is the default, so it's the bare path — no ?tab=account.
    href: t === "account" ? "/settings" : `/settings?tab=${t}`,
  }));

  // Mail for the inbound domain is routed to Resend → /api/inbound/receipts.
  // RECEIPTS_EMAIL overrides it if a friendlier alias is set up to forward there.
  const inboundDomain = process.env.INBOUND_DOMAIN;
  const friendlyAddress =
    process.env.RECEIPTS_EMAIL ??
    (inboundDomain ? `receipts@${inboundDomain}` : null);

  return (
    <>
      <PageHeader title="Settings" subtitle={TAB_META[active].subtitle} />

      <FilterTabs
        tabs={tabs}
        active={active}
        aria-label="Settings section"
        className="mb-6 max-w-3xl"
      />

      {/* [&>*]:min-w-0 — grid items default to `min-width: auto`, so a card
          can't shrink below its content's intrinsic width. The long inbound
          address then pushed every card past the screen on a phone instead of
          truncating inside it. */}
      <div className="grid max-w-3xl gap-6 [&>*]:min-w-0">
        {active === "import" && owner && (
          <Card>
            <CardHeader>
              <CardTitle>Import from Wave</CardTitle>
            </CardHeader>
            <CardContent>
              <WaveSync />
            </CardContent>
          </Card>
        )}

        {active === "import" && (
          <Card>
            <CardHeader>
              <CardTitle>Email a receipt</CardTitle>
              <CardDescription>
                {friendlyAddress ? (
                  <>
                    Forward a receipt (image or PDF attached) from{" "}
                    <strong>{user.email}</strong> to the address below. It is
                    read automatically — vendor, amount, date, and category are
                    filled in, and a matching transaction is filed for review.
                  </>
                ) : (
                  <>
                    Not configured yet — set <code>INBOUND_DOMAIN</code> (and
                    point its MX records at Resend) to enable emailing receipts
                    in.
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
        )}

        {active === "account" && (
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
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
        )}

        {active === "team" && (
          <Card>
            <CardHeader>
              <CardTitle>Team access</CardTitle>
              <CardDescription>
                {owner
                  ? "Give your accountant or teammates access to your data. They'll get access as soon as they sign in with this email (password or Google). “View & export” can see everything but not change it."
                  : "People with access to this account's data."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              {/* The form lays itself out (email flexes, role is a fixed 180px
                  column), so it wants the card's full width — a max-w wrapper
                  just squeezed the email field until the address truncated. */}
              {owner && <TeamInviteForm />}

              {grants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No one else has access yet.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {grants.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {g.member_email}
                        </p>
                        <div className="mt-1">
                          <StatusPill
                            status={g.role === "editor" ? "sent" : "upload"}
                          />
                          <span className="ml-2 text-xs text-muted-foreground">
                            {g.role === "editor"
                              ? "Full edit"
                              : "View & export"}
                          </span>
                        </div>
                      </div>
                      {owner && (
                        <form action={removeMemberAction}>
                          <input type="hidden" name="id" value={g.id} />
                          <button
                            type="submit"
                            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-brand-red/10 hover:text-brand-red"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {active === "account" && (
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change the password you use to sign in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm">
                <PasswordForm submitLabel="Update password" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default SettingsPage;
