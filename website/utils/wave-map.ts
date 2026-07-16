import { WaveMoney } from "@interfaces/models/wave/WaveMoney";
import { WaveAddress } from "@interfaces/models/wave/WaveAddress";
import { WaveCustomerNode } from "@interfaces/models/wave/WaveCustomerNode";
import { InvoiceStatus } from "@typings/invoice/InvoiceStatus";
import { EstimateStatus } from "@typings/estimate/EstimateStatus";

/** Parse a Wave decimal string ("6,000.00") to a number. */
export const parseWaveMoney = (
  money: WaveMoney | string | null | undefined,
): number => {
  const raw = typeof money === "string" ? money : (money?.value ?? "0");
  const n = parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Map a Wave invoice status to our three-state model. */
export const mapInvoiceStatus = (waveStatus: string): InvoiceStatus => {
  const s = waveStatus.toUpperCase();
  if (s === "PAID") return "paid";
  if (s === "DRAFT" || s === "SAVED") return "draft";
  return "sent"; // SENT, VIEWED, PARTIAL, OVERDUE, UNSENT → sent
};

/** Map a Wave estimate status to our model. */
export const mapEstimateStatus = (waveStatus: string): EstimateStatus => {
  const s = waveStatus.toUpperCase();
  if (s === "ACCEPTED") return "accepted";
  if (s === "DECLINED" || s === "REFUSED") return "declined";
  if (s === "DRAFT" || s === "SAVED") return "draft";
  return "sent";
};

/** Flatten a Wave address into our single-field multiline address string. */
export const buildAddress = (address: WaveAddress | null): string | null => {
  if (!address) return null;
  const lines = [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.province?.name, address.postalCode]
      .filter(Boolean)
      .join(", "),
    address.country?.name,
  ].filter((l): l is string => Boolean(l && l.trim()));
  return lines.length ? lines.join("\n") : null;
};

/** Best display name for a Wave customer (company name, falling back to person). */
export const waveContactName = (c: WaveCustomerNode): string =>
  c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || "Customer";
