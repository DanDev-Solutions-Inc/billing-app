"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import * as access from "@services/supabase/profile-access";
import { deleteAccountByEmail } from "@services/supabase/auth-admin";
import { sendAccessInviteEmail } from "@lib/email";
import { AccessRole } from "@typings/profile-access/AccessRole";
import { InviteState } from "@interfaces/forms/InviteState";
import { BUSINESS } from "@utils/constants";

/** Only the account owner manages team access — members granted access can't
 *  re-share it. The owner is the business contact address. */
const isOwner = (email?: string | null) =>
  email?.toLowerCase() === BUSINESS.contactEmail.toLowerCase();

export const inviteMemberAction = async (
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> => {
  const user = await getUserOrRedirect();
  if (!isOwner(user.email))
    return { error: "Only the account owner can invite team members." };
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = (String(formData.get("role") ?? "viewer") as AccessRole) || "viewer";
  if (!email) return { error: "Enter an email address." };
  if (email === user.email?.toLowerCase())
    return { error: "That's your own account." };

  const supabase = await createClient();
  const { error } = await access.inviteMember(supabase, user.id, email, role);
  if (error) return { error };

  // Email them the signup link. The grant already works if they had an account;
  // the email is what tells someone who doesn't that they need to make one.
  const headerList = await headers();
  const origin = `${headerList.get("x-forwarded-proto") ?? "https"}://${headerList.get("host")}`;
  const sent = await sendAccessInviteEmail({
    to: email,
    role,
    invitedBy: user.email ?? "The account owner",
    signupUrl: `${origin}/signup`,
  });

  revalidatePath("/team");
  // The grant is what grants access; a failed email shouldn't read as a failed
  // invite. Report the send outcome instead of hiding it.
  if (sent.error)
    return {
      ok: `${email} was granted access, but the invite email didn't send (${sent.error}). They can still sign up with that address.`,
    };
  return { ok: `Invite sent to ${email}. They'll get access once they sign up with that address.` };
};

export const removeMemberAction = async (formData: FormData) => {
  const user = await getUserOrRedirect();
  // Same gate as inviting — a member can't revoke others' access. Server-side
  // because a Server Action is directly POST-reachable, not just UI-hidden.
  if (!isOwner(user.email)) return;
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  // Read the email before dropping the grant, then delete the account too — a
  // clean removal that closes their sessions, not just a blocked login. Guard
  // against ever deleting the owner (a grant is never the owner's, but be sure).
  const email = await access.getGrantEmail(supabase, id);
  await access.removeGrant(supabase, id);
  if (email && !isOwner(email)) await deleteAccountByEmail(email);

  revalidatePath("/team");
};
