import "server-only";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";

/**
 * Reconstruct line items from a submitted form. The editor renders repeated
 * inputs named item_description / item_quantity / item_unit_price, so getAll()
 * returns them row-aligned. Rows with a blank description are dropped.
 */
export const parseLineItems = (formData: FormData): LineItemFormValues[] => {
  const descriptions = formData.getAll("item_description").map(String);
  const quantities = formData.getAll("item_quantity").map(String);
  const prices = formData.getAll("item_unit_price").map(String);

  const items: LineItemFormValues[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i].trim();
    if (!description) continue;
    items.push({
      description,
      quantity: Number(quantities[i]) || 0,
      unit_price: Number(prices[i]) || 0,
    });
  }
  return items;
};

export const emptyToNull = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
