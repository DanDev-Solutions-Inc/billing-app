import "server-only";
import { USD_TO_CAD } from "@utils/fx";

const VALET = "https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json";

/**
 * The Bank of Canada's official USD→CAD rate for a date.
 *
 * Fetched at invoice time rather than read from a constant: USD invoicing is
 * rare here (once a year), so a hardcoded rate would be stale on every single
 * one — the rate moved 1.25 → 1.38 across the existing history. This is the
 * series CRA accepts, it's free, and it's one call per invoice.
 *
 * Falls back to USD_TO_CAD if the API is unreachable — a slightly-off rate is
 * better than a failed invoice, and the stored value can be corrected later.
 */
export const usdToCadOn = async (date: string): Promise<number> => {
  try {
    // Rates don't publish on weekends/holidays; look back far enough to clear
    // any run of them and take the most recent observation.
    const from = new Date(`${date}T00:00:00`);
    from.setDate(from.getDate() - 10);

    const res = await fetch(
      `${VALET}?start_date=${from.toISOString().slice(0, 10)}&end_date=${date}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return USD_TO_CAD;

    const json = (await res.json()) as {
      observations?: { d: string; FXUSDCAD?: { v?: string } }[];
    };
    const observations = json.observations ?? [];
    const latest = observations[observations.length - 1];
    const rate = Number(latest?.FXUSDCAD?.v);

    return Number.isFinite(rate) && rate > 0 ? rate : USD_TO_CAD;
  } catch {
    return USD_TO_CAD;
  }
};
