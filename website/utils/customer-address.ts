import { Customer } from "@typings/customer/Customer";

type AddressParts = Pick<
  Customer,
  | "address"
  | "address_line1"
  | "address_line2"
  | "city"
  | "province"
  | "postal_code"
  | "country"
>;

/**
 * Address as display lines. Falls back to the legacy free-text `address` for
 * the imported customers whose text was too ambiguous to split into columns.
 */
export const customerAddressLines = (c: AddressParts): string[] => {
  const structured = [
    c.address_line1,
    c.address_line2,
    [c.city, c.province, c.postal_code].filter(Boolean).join(", ") || null,
    c.country,
  ].filter((l): l is string => Boolean(l?.trim()));

  if (structured.length > 0) return structured;
  return (c.address ?? "").split("\n").filter((l) => l.trim());
};

/** Single-line form, for table cells. */
export const customerAddressLine = (c: AddressParts): string =>
  customerAddressLines(c).join(", ");
