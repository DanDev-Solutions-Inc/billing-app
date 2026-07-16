import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { Profile } from "@typings/profile/Profile";

export const getProfile = async (
  sb: SupabaseClient,
  userId: string,
): Promise<Profile | null> => {
  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
};

/** Look up a user by their inbound-email token (webhook only; needs admin client). */
export const getProfileByInboundToken = async (
  admin: SupabaseClient,
  token: string,
): Promise<Profile | null> => {
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("inbound_token", token)
    .maybeSingle();
  return data ?? null;
};
