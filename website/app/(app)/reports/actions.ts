"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import * as planning from "@services/supabase/planning";

/* Clamped rather than validated-and-rejected: every field is a planning
   assumption with an obvious sane range, and bouncing the whole form because a
   percentage read 105 would be a worse experience than pinning it to 100. */
const num = (v: FormDataEntryValue | null, min: number, max: number): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
};

export const savePlanAction = async (formData: FormData) => {
  const user = await getUserOrRedirect();
  const supabase = await createClient();

  await planning.savePlanningSettings(supabase, user.id, {
    monthly_total: num(formData.get("monthly_total"), 0, 1_000_000),
    salary_share_percent: num(formData.get("salary_share_percent"), 0, 100),
    employer_cost_percent: num(formData.get("employer_cost_percent"), 0, 100),
    personal_salary_rate: num(formData.get("personal_salary_rate"), 0, 100),
    personal_dividend_rate: num(formData.get("personal_dividend_rate"), 0, 100),
  });

  revalidatePath("/reports");
};
