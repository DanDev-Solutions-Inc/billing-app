import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getUser } from "@lib/dal";
import { createClient } from "@lib/supabase/server";
import { exchangeCodeForToken, waveGraphql } from "@lib/wave/client";
import { importWaveBusiness } from "@services/wave/import-wave-business";

export const runtime = "nodejs";

// Wave OAuth callback: verifies state, exchanges the code, and imports the
// business's data for the signed-in user.
export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const origin = url.origin;

  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const savedState = store.get("wave_oauth_state")?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/settings?wave=error", origin));
  }
  store.delete("wave_oauth_state");

  try {
    const token = await exchangeCodeForToken(code);
    const businessId =
      process.env.WAVE_BUSINESS_ID ||
      (await firstBusinessId(token.access_token));
    if (!businessId) throw new Error("No Wave business found");

    const supabase = await createClient();
    await importWaveBusiness(supabase, user.id, token.access_token, businessId);

    for (const path of [
      "/customers",
      "/invoices",
      "/estimates",
      "/transactions",
      "/dashboard",
    ]) {
      revalidatePath(path);
    }
    return NextResponse.redirect(new URL("/invoices?wave=ok", origin));
  } catch {
    return NextResponse.redirect(new URL("/settings?wave=error", origin));
  }
};

const firstBusinessId = async (token: string): Promise<string | null> => {
  const data = await waveGraphql<{
    businesses: { edges: { node: { id: string; isPersonal: boolean } }[] };
  }>(token, `{ businesses(page:1,pageSize:10){ edges{ node{ id isPersonal } } } }`);
  const business =
    data.businesses.edges.find((e) => !e.node.isPersonal) ??
    data.businesses.edges[0];
  return business?.node.id ?? null;
};
