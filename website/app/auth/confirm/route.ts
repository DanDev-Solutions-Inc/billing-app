import { type NextRequest, NextResponse } from "next/server";
import { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@lib/supabase/server";

// Handles the email-confirmation link Supabase sends on signup.
// Configure the Supabase "Confirm signup" email template to point at:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", origin));
};
