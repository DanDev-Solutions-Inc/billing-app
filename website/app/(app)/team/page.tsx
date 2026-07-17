import { Metadata } from "next";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listGrants } from "@services/supabase/profile-access";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatusPill,
  EmptyState,
} from "@components/ui";
import { TeamInviteForm } from "@components/team-invite-form";
import { removeMemberAction } from "./actions";
import { BUSINESS } from "@utils/constants";

export const metadata: Metadata = { title: "Team" };

const TeamPage = async () => {
  const user = await getUserOrRedirect();
  const supabase = await createClient();
  const grants = await listGrants(supabase);

  // Only the owner manages access; members granted access just see the list.
  // The Server Actions enforce this too — this is the matching UI.
  const isOwner =
    user.email?.toLowerCase() === BUSINESS.contactEmail.toLowerCase();

  return (
    <>
      <PageHeader
        title="Team"
        subtitle={
          isOwner
            ? "Give your accountant or teammates access to your data."
            : "People with access to this account's data."
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {isOwner && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Invite someone</CardTitle>
              <CardDescription>
                They&apos;ll get access as soon as they sign in with this email
                (password or Google). &ldquo;View &amp; export&rdquo; can see
                everything but not change it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamInviteForm />
            </CardContent>
          </Card>
        )}

        <div>
          {grants.length === 0 ? (
            <EmptyState
              title="No one else has access"
              description="Invite your accountant to view your invoices, expenses, and reports."
            />
          ) : (
            <Card className="divide-y divide-border overflow-hidden">
              {grants.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
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
                        {g.role === "editor" ? "Full edit" : "View & export"}
                      </span>
                    </div>
                  </div>
                  {isOwner && (
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
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default TeamPage;
