import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@lib/supabase/server";

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
