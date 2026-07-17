"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import * as access from "@services/supabase/profile-access";
import { sendAccessInviteEmail } from "@lib/email";
import { AccessRole } from "@typings/profile-access/AccessRole";
import { InviteState } from "@interfaces/forms/InviteState";

export const inviteMemberAction = async (
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> => {
  const user = await getUserOrRedirect();
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
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await access.removeGrant(supabase, id);
  revalidatePath("/team");
};
