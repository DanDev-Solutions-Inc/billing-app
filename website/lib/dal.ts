import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@lib/supabase/server";
import { BUSINESS } from "@utils/constants";

/**
 * Data Access Layer. Server Actions bypass the proxy, so authorization is
 * verified here (and by Postgres RLS) on every data access — never only in proxy.
 * cache() dedupes getUser() across a single request.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getUserOrRedirect = async (): Promise<User> => {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
};

/** The account owner is the business contact address — the only person who can
 *  manage team access or run the Wave import. Shared so the pages and the
 *  Server Actions they post to can't drift apart on who counts as owner. */
export const isOwner = (email?: string | null): boolean =>
  email?.toLowerCase() === BUSINESS.contactEmail.toLowerCase();

/**
 * App access, not just a session: the owner, or someone who currently holds an
 * access grant. Removing a team member only drops their grant — their auth
 * account lives on — so without this a removed user could still sign in to an
 * empty shell. RLS already hides the owner's *data* from them; this shuts the
 * door on the app itself.
 *
 * Denied users go to /auth/leave (which clears the session), not straight to
 * /login: the proxy bounces a still-logged-in user off /login, so redirecting
 * there directly would loop.
 */
export const requireAppAccess = async (): Promise<User> => {
  const user = await getUserOrRedirect();
  const email = user.email?.toLowerCase() ?? "";
  if (isOwner(email)) return user;

  const supabase = await createClient();
  // RLS ("member sees own") lets a member read exactly their own grant row, so
  // this returns a row only while the grant is live.
  const { data } = await supabase
    .from("profile_access")
    .select("id")
    .eq("member_email", email)
    .limit(1);
  if (!data?.length) redirect("/auth/leave?reason=no-access");
  return user;
};
