import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { ProfileAccess } from "@typings/profile-access/ProfileAccess";
import { AccessRole } from "@typings/profile-access/AccessRole";

/** People the current user has granted access to their profile. */
export const listGrants = async (
  sb: SupabaseClient,
): Promise<ProfileAccess[]> => {
  const { data } = await sb
    .from("profile_access")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
};

export const inviteMember = async (
  sb: SupabaseClient,
  ownerId: string,
  memberEmail: string,
  role: AccessRole,
): Promise<{ error?: string }> => {
  const { error } = await sb
    .from("profile_access")
    .upsert(
      { owner_id: ownerId, member_email: memberEmail.toLowerCase(), role },
      { onConflict: "owner_id,member_email" },
    );
  return { error: error?.message };
};

export const removeGrant = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  await sb.from("profile_access").delete().eq("id", id);
};
