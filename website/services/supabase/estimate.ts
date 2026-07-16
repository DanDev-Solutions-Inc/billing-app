import "server-only";
import { SupabaseClient } from "@typings/SupabaseClient";
import { EstimateStatus } from "@typings/estimate/EstimateStatus";
import { EstimateInsert } from "@typings/estimate/EstimateInsert";
import { EstimateWithCustomer } from "@interfaces/models/estimate/EstimateWithCustomer";

const WITH_CUSTOMER = "*, customers(*)";

export const listEstimates = async (
  sb: SupabaseClient,
): Promise<EstimateWithCustomer[]> => {
  const { data } = await sb
    .from("estimates")
    .select(WITH_CUSTOMER)
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as EstimateWithCustomer[];
};

export const getEstimate = async (
  sb: SupabaseClient,
  id: string,
): Promise<EstimateWithCustomer | null> => {
  const { data } = await sb
    .from("estimates")
    .select(WITH_CUSTOMER)
    .eq("id", id)
    .maybeSingle();
  return (data as EstimateWithCustomer) ?? null;
};

export const createEstimate = async (
  sb: SupabaseClient,
  values: EstimateInsert,
): Promise<{ id?: string; error?: string }> => {
  const { data, error } = await sb
    .from("estimates")
    .insert(values)
    .select("id")
    .single();
  return { id: data?.id, error: error?.message };
};

export const updateEstimateStatus = async (
  sb: SupabaseClient,
  id: string,
  status: EstimateStatus,
): Promise<void> => {
  await sb.from("estimates").update({ status }).eq("id", id);
};

export const setEstimateConverted = async (
  sb: SupabaseClient,
  id: string,
  invoiceId: string,
): Promise<void> => {
  await sb
    .from("estimates")
    .update({ converted_invoice_id: invoiceId })
    .eq("id", id);
};

export const deleteEstimate = async (
  sb: SupabaseClient,
  id: string,
): Promise<void> => {
  await sb.from("estimates").delete().eq("id", id);
};

/** Insert or update an estimate keyed by (user_id, wave_id). Returns the row id. */
export const upsertEstimateByWaveId = async (
  sb: SupabaseClient,
  values: EstimateInsert,
): Promise<{ id?: string; error?: string }> => {
  const { data: existing } = await sb
    .from("estimates")
    .select("id")
    .eq("user_id", values.user_id)
    .eq("wave_id", values.wave_id ?? "")
    .maybeSingle();
  if (existing) {
    const { error } = await sb
      .from("estimates")
      .update(values)
      .eq("id", existing.id);
    return { id: existing.id, error: error?.message };
  }
  const { data, error } = await sb
    .from("estimates")
    .insert(values)
    .select("id")
    .single();
  return { id: data?.id, error: error?.message };
};
