"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import * as access from "@services/supabase/profile-access";
import { AccessRole } from "@typings/profile-access/AccessRole";

export interface InviteState {
  error?: string;
  ok?: string;
}

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

  revalidatePath("/team");
  return { ok: `${email} can now access your data when they sign in.` };
};

export const removeMemberAction = async (formData: FormData) => {
  await getUserOrRedirect();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await access.removeGrant(supabase, id);
  revalidatePath("/team");
};
