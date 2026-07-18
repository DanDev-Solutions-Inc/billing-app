import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { PlanningSettings } from "@interfaces/models/reports/PlanningSettings";

/* Mirrors the column defaults in 20260720000000_planning_settings.sql. Repeated
   here because a user with no saved row must still get a usable planner rather
   than a page of zeroes and a division by nothing. */
export const PLANNING_DEFAULTS: PlanningSettings = {
  monthly_total: 0,
  salary_share_percent: 100,
  employer_cost_percent: 7.4,
  personal_salary_rate: 20,
  personal_dividend_rate: 10,
};

/**
 * The owner's saved compensation plan, or the defaults if they've never saved.
 *
 * Absence is the normal first-run state, not an error — hence defaults rather
 * than null. Every value is an assumption to be tuned, so a missing row and an
 * untouched row should behave identically.
 */
export const getPlanningSettings = async (
  sb: SupabaseClient,
): Promise<PlanningSettings> => {
  const { data } = await sb
    .from("planning_settings")
    .select(
      "monthly_total, salary_share_percent, employer_cost_percent, personal_salary_rate, personal_dividend_rate",
    )
    .maybeSingle();

  if (!data) return PLANNING_DEFAULTS;

  // Postgres numerics arrive as strings.
  return {
    monthly_total: Number(data.monthly_total),
    salary_share_percent: Number(data.salary_share_percent),
    employer_cost_percent: Number(data.employer_cost_percent),
    personal_salary_rate: Number(data.personal_salary_rate),
    personal_dividend_rate: Number(data.personal_dividend_rate),
  };
};

/** Upsert on the primary key — one row per user, so saving twice updates. */
export const savePlanningSettings = async (
  sb: SupabaseClient,
  userId: string,
  settings: PlanningSettings,
): Promise<{ error?: string }> => {
  const { error } = await sb
    .from("planning_settings")
    .upsert({ user_id: userId, ...settings }, { onConflict: "user_id" });
  return error ? { error: error.message } : {};
};
