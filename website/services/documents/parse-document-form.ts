import "server-only";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { parseLineItems, emptyToNull, parseCurrency } from "@utils/doc-helpers";
import { computeTotals } from "@utils/money";
import { chargesTax } from "@utils/currency";
import { today } from "@utils/date";
import { usdToCadOn } from "@services/fx/boc-rate";
import { ParsedDocumentForm } from "@interfaces/services/ParsedDocumentForm";

/**
 * Read an invoice/estimate form into the values needed to store one.
 *
 * This exists because the same ~20 lines were copy-pasted four times (invoice
 * create/update, estimate create/update), which meant the currency→tax rule
 * lived in four places. It diverged exactly as you'd expect: the recurring edit
 * path missed the rule entirely and silently stopped charging HST. One
 * implementation, one place to change it.
 *
 * Returns null when there are no line items, so callers just check for it.
 */
export const parseDocumentForm = async (
  formData: FormData,
): Promise<ParsedDocumentForm | null> => {
  const user = await getUserOrRedirect();
  const items = parseLineItems(formData);
  if (items.length === 0) return null;

  /* The rate is derived from the currency, never read from the form: a USD
     document is never taxed, and that rule can't live only in the UI. */
  const currency = parseCurrency(formData.get("currency"));
  const taxRate = chargesTax(currency)
    ? Number(formData.get("tax_rate")) || 0
    : 0;

  const issueDate = emptyToNull(formData.get("issue_date")) ?? today();

  return {
    user,
    supabase: await createClient(),
    items,
    currency,
    totals: computeTotals(items, taxRate),
    issueDate,
    /* The day's official rate, so the document reports in CAD at what it was
       actually worth. CAD is 1 by identity, so it costs no call. */
    exchangeRate: currency === "USD" ? await usdToCadOn(issueDate) : 1,
    customerId: emptyToNull(formData.get("customer_id")),
    number: emptyToNull(formData.get("number")),
    secondDate: emptyToNull(formData.get("second_date")),
    notes: emptyToNull(formData.get("notes")),
  };
};
