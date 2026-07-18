"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect, isOwner } from "@lib/dal";
import { importWaveBusiness } from "@services/wave/import-wave-business";
import { WaveSyncState } from "@interfaces/forms/WaveSyncState";

export const syncFromWave = async (
  _prev: WaveSyncState,
  _formData: FormData,
): Promise<WaveSyncState> => {
  const user = await getUserOrRedirect();
  // Owner-only: the Wave import writes into the owner's books, so a member with
  // access mustn't trigger it. Server-side because the action is POST-reachable.
  if (!isOwner(user.email))
    return { error: "Only the account owner can import from Wave." };

  const token = process.env.WAVE_FULL_ACCESS_TOKEN;
  const businessId = process.env.WAVE_BUSINESS_ID;
  if (!token || !businessId)
    return { error: "Wave is not configured (token / business id)." };

  const supabase = await createClient();
  try {
    const summary = await importWaveBusiness(
      supabase,
      user.id,
      token,
      businessId,
    );
    revalidatePath("/customers");
    revalidatePath("/invoices");
    revalidatePath("/estimates");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { summary };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Import failed." };
  }
};
