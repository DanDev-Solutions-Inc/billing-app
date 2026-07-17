"use client";

import { useFormik } from "formik";
import { LineItemsEditor } from "@components/invoices/line-items-editor";
import { Card, Field, inputClass, Button, Select } from "@components/ui";
import { Combobox } from "@components/ui/combobox";
import { documentSchema } from "@utils/validation/documentSchema";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { DocumentFormValues } from "@interfaces/forms/DocumentFormValues";
import { DocFormProps } from "@interfaces/components/DocFormProps";
import { CurrencyCode } from "@typings/CurrencyCode";
import {
  CURRENCIES,
  taxRateFor,
  chargesTax,
  toCurrency,
} from "@utils/currency";

export interface DocFormState {
  error?: string;
}

const today = () => {
  // Local date as yyyy-mm-dd for the date input default.
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

const blankItem = (): LineItemFormValues => ({
  description: "",
  quantity: 1,
  unit_price: 0,
});

/* Payment terms. The due/expiry date is derived from the issue date rather
   than typed, so the two can't drift out of sync. */
const TERMS = [7, 15, 30] as const;
/* Invoices default to Net 30 — the standard terms, so a new invoice is ready
   to send without touching the date. Estimates have no implied expiry. */
const DEFAULT_INVOICE_TERM = 30;

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

const daysBetween = (from: string, to: string) =>
  Math.round(
    (new Date(`${to}T00:00:00`).getTime() -
      new Date(`${from}T00:00:00`).getTime()) /
      86_400_000,
  );

export const DocForm = ({
  kind,
  customers,
  action,
  defaults,
  submitLabel,
}: DocFormProps) => {
  const isInvoice = kind === "invoice";
  const secondDateLabel = isInvoice ? "Due date" : "Expiry date";
  const numberLabel = isInvoice ? "Invoice #" : "Estimate #";

  const initialIssueDate = defaults?.issueDate ?? today();

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
    hint: c.email ?? undefined,
  }));

  const formik = useFormik<DocumentFormValues>({
    initialValues: {
      currency: defaults?.currency ?? "CAD",
      customer_id: defaults?.customerId ?? "",
      number: defaults?.number ?? "",
      issue_date: initialIssueDate,
      second_date:
        defaults?.secondDate ??
        (isInvoice ? addDays(initialIssueDate, DEFAULT_INVOICE_TERM) : ""),
      notes: defaults?.notes ?? "",
      tax_rate: defaults?.taxRate ?? taxRateFor(defaults?.currency ?? "CAD"),
      items:
        defaults?.items && defaults.items.length
          ? defaults.items
          : [blankItem()],
    },
    validationSchema: documentSchema,
    onSubmit: async (values, { setStatus }) => {
      const formData = new FormData();
      values.items.forEach((it) => {
        formData.append("item_description", it.description);
        formData.append("item_quantity", String(it.quantity));
        formData.append("item_unit_price", String(it.unit_price));
      });
      formData.set("currency", values.currency);
      formData.set("tax_rate", String(values.tax_rate));
      formData.set("customer_id", values.customer_id);
      formData.set("number", values.number);
      formData.set("issue_date", values.issue_date);
      formData.set("second_date", values.second_date);
      formData.set("notes", values.notes);
      const result = await action({}, formData);
      if (result?.error) setStatus({ error: result.error });
    },
  });

  const status = formik.status as { error?: string } | undefined;

  /* Currency decides the tax rate: US work is billed in USD with no tax. So
     switching currency rewrites the rate rather than leaving a stale one. */
  const onCurrencyChange = (next: CurrencyCode) => {
    formik.setFieldValue("currency", next);
    formik.setFieldValue("tax_rate", taxRateFor(next));
  };

  /* Picking a customer adopts their usual currency — a US customer shouldn't
     need the choice made by hand every time. Only on a real change, so it can't
     stomp a currency already chosen for this document. */
  const onCustomerChange = (nextId: string) => {
    formik.setFieldValue("customer_id", nextId);
    const customer = customers.find((c) => c.id === nextId);
    if (customer && customer.currency !== formik.values.currency) {
      onCurrencyChange(customer.currency);
    }
  };

  const onItemChange = (
    index: number,
    field: keyof LineItemFormValues,
    value: string,
  ) => {
    const items = formik.values.items.map((it, i) =>
      i === index
        ? {
            ...it,
            [field]: field === "description" ? value : Number(value),
          }
        : it,
    );
    formik.setFieldValue("items", items);
  };

  const onAddRow = () =>
    formik.setFieldValue("items", [...formik.values.items, blankItem()]);

  const onRemoveRow = (index: number) => {
    if (formik.values.items.length <= 1) return;
    formik.setFieldValue(
      "items",
      formik.values.items.filter((_, i) => i !== index),
    );
  };

  const itemsError =
    typeof formik.errors.items === "string" ? formik.errors.items : undefined;

  /* Derive which term is selected from the dates themselves, so editing an
     existing document shows the right option (and "Custom" for a hand-set
     date that doesn't line up with a preset). */
  const { issue_date, second_date } = formik.values;
  const termDays =
    issue_date && second_date ? daysBetween(issue_date, second_date) : null;
  const isPresetTerm =
    termDays !== null && (TERMS as readonly number[]).includes(termDays);
  const termValue = !second_date ? "" : isPresetTerm ? String(termDays) : "custom";

  const onTermChange = (value: string) => {
    if (value === "custom") return; // display-only
    formik.setFieldValue(
      "second_date",
      value === "" ? "" : addDays(issue_date, Number(value)),
    );
  };

  /* Moving the issue date keeps a preset term intact by re-deriving the date. */
  const onIssueDateChange = (next: string) => {
    formik.setFieldValue("issue_date", next);
    if (next && isPresetTerm) {
      formik.setFieldValue("second_date", addDays(next, termDays));
    }
  };

  const termLabel = (days: number) =>
    `${isInvoice ? `Net ${days}` : `${days} days`} · ${addDays(issue_date, days)}`;

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* z-20: `.vui-glass` sets backdrop-filter, which creates a stacking
          context per Card. The customer combobox's dropdown is z-50 *inside*
          this card, so without raising the card itself the later "Line items"
          card paints over the open list. */}
      <Card className="relative z-20 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" htmlFor="customer_id">
            {/* Searchable: scrolling a plain select for 28+ customers is slow,
                and the email disambiguates similar names. */}
            <Combobox
              id="customer_id"
              name="customer_id"
              options={customerOptions}
              value={formik.values.customer_id}
              onChange={onCustomerChange}
              emptyLabel="— None —"
              placeholder="Search customers…"
              aria-label="Customer"
            />
          </Field>
          <Field label="Currency" htmlFor="currency">
            <Select
              id="currency"
              name="currency"
              value={formik.values.currency}
              onChange={(e) => onCurrencyChange(toCurrency(e.target.value))}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                  {chargesTax(c) ? "" : " · no tax"}
                </option>
              ))}
            </Select>
          </Field>
          {isInvoice ? (
            <Field label="Invoice #">
              <div className={`${inputClass} border-dashed bg-white/[0.02] text-muted-foreground/70`}>
                Auto-generated (sequential)
              </div>
            </Field>
          ) : (
            <Field label={numberLabel} htmlFor="number">
              <input
                id="number"
                name="number"
                value={formik.values.number}
                onChange={formik.handleChange}
                placeholder="Optional"
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Issue date" htmlFor="issue_date">
            <input
              id="issue_date"
              name="issue_date"
              type="date"
              value={formik.values.issue_date}
              onChange={(e) => onIssueDateChange(e.target.value)}
              className={inputClass}
            />
            {formik.touched.issue_date && formik.errors.issue_date && (
              <p className="text-xs text-brand-red">
                {formik.errors.issue_date}
              </p>
            )}
          </Field>
          <Field label={secondDateLabel} htmlFor="second_date_terms">
            <Select
              id="second_date_terms"
              value={termValue}
              onChange={(e) => onTermChange(e.target.value)}
              disabled={!issue_date}
            >
              <option value="">No {secondDateLabel.toLowerCase()}</option>
              {TERMS.map((d) => (
                <option key={d} value={d}>
                  {termLabel(d)}
                </option>
              ))}
              {termValue === "custom" && (
                <option value="custom">Custom · {second_date}</option>
              )}
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
          Line items
        </h2>
        <LineItemsEditor
          items={formik.values.items}
          taxRate={formik.values.tax_rate}
          currency={formik.values.currency}
          onItemChange={onItemChange}
          onAddRow={onAddRow}
          onRemoveRow={onRemoveRow}
          onTaxRateChange={(value) => formik.setFieldValue("tax_rate", value)}
        />
        {itemsError && (
          <p className="mt-3 text-sm text-brand-red">{itemsError}</p>
        )}
      </Card>

      <Card className="p-6">
        <Field label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formik.values.notes}
            onChange={formik.handleChange}
            placeholder="Payment terms, thank-you note, etc."
            className={inputClass}
          />
        </Field>
      </Card>

      {status?.error && <p className="text-sm text-brand-red">{status.error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Saving…" : (submitLabel ?? `Create ${kind}`)}
        </Button>
      </div>
    </form>
  );
};
