import "server-only";
import { createAdminClient } from "@lib/supabase/admin";

/**
 * Delete the auth account behind an email, which closes all of its sessions at
 * once. Used when an owner removes a team member: a member account exists only
 * to reach the owner's data through a grant, so removal is a clean delete
 * rather than a lingering, blocked login.
 *
 * A no-op when there's no account (invited but never signed up). Service-role
 * client — this is the only user-management path outside the webhooks.
 */
export const deleteAccountByEmail = async (email: string): Promise<void> => {
  const admin = createAdminClient();
  // The admin API has no getUserByEmail, and the member base is tiny, so one
  // page is plenty. Revisit if the user count ever approaches this.
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = data?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (user) await admin.auth.admin.deleteUser(user.id);
};
