"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@lib/supabase/server";
import { AuthState } from "@interfaces/forms/AuthState";

const readCredentials = (formData: FormData) => ({
  email: String(formData.get("email") ?? "").trim(),
  password: String(formData.get("password") ?? ""),
});

export const login = async (
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> => {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
};

export const signup = async (
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> => {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 6)
    return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // Supabase hides "email already registered" behind a fake success to prevent
  // enumeration: it returns a user with an empty `identities` array and no
  // session. Surface it plainly instead of a misleading "check your email" —
  // this is what strands someone who signed up with Google and then tries a
  // password (that account has no password to set this way).
  if (data.user && data.user.identities?.length === 0) {
    return {
      error:
        "An account with this email already exists. Sign in instead — use “Continue with Google” if that's how you signed up.",
    };
  }

  // Email confirmation required (no session yet).
  if (!data.session) {
    return { message: "Check your email to confirm your account, then sign in." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
};

export const requestPasswordReset = async (
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> => {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const headerList = await headers();
  const origin = `${headerList.get("x-forwarded-proto") ?? "https"}://${headerList.get("host")}`;

  const supabase = await createClient();
  // The recovery link lands on /auth/callback, which exchanges the code for a
  // (recovery) session and forwards to /reset-password to set a new one. Origin
  // is taken from the request so it works in every environment.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Always the same reply, whether or not the address has an account — telling
  // the difference would let anyone probe which emails are registered.
  return {
    message:
      "If that email has an account, a reset link is on its way. Check your inbox.",
  };
};

/**
 * Set a new password for the signed-in user — used both from Settings and by
 * the recovery flow, where the reset link has already established a session.
 */
export const updatePassword = async (
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> => {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6)
    return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  // No session ⇒ getUser() is null ⇒ updateUser 401s. Check first so the
  // message is "your reset link expired", not a raw auth error.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: "Your session has expired. Request a new reset link." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { message: "Password updated." };
};

export const signInWithGoogle = async () => {
  const headerList = await headers();
  const origin = `${headerList.get("x-forwarded-proto") ?? "https"}://${headerList.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
};

export const logout = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
};
