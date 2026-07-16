"use client";

import { useFormik } from "formik";
import { LineItemsEditor } from "@components/invoices/line-items-editor";
import { Card, Field, inputClass, Button } from "@components/ui";
import { documentSchema } from "@utils/validation/documentSchema";
import { LineItemFormValues } from "@interfaces/forms/LineItemFormValues";
import { DocumentFormValues } from "@interfaces/forms/DocumentFormValues";
import { DocFormProps } from "@interfaces/components/DocFormProps";

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

export const DocForm = ({ kind, customers, action, defaults }: DocFormProps) => {
  const isInvoice = kind === "invoice";
  const secondDateLabel = isInvoice ? "Due date" : "Expiry date";
  const numberLabel = isInvoice ? "Invoice #" : "Estimate #";

  const formik = useFormik<DocumentFormValues>({
    initialValues: {
      customer_id: defaults?.customerId ?? "",
      number: defaults?.number ?? "",
      issue_date: defaults?.issueDate ?? today(),
      second_date: defaults?.secondDate ?? "",
      notes: defaults?.notes ?? "",
      tax_rate: defaults?.taxRate ?? 13,
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

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6" noValidate>
      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" htmlFor="customer_id">
            <select
              id="customer_id"
              name="customer_id"
              value={formik.values.customer_id}
              onChange={formik.handleChange}
              className={inputClass}
            >
              <option value="">— None —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
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
          <Field label="Issue date" htmlFor="issue_date">
            <input
              id="issue_date"
              name="issue_date"
              type="date"
              value={formik.values.issue_date}
              onChange={formik.handleChange}
              className={inputClass}
            />
            {formik.touched.issue_date && formik.errors.issue_date && (
              <p className="text-xs text-brand-red">
                {formik.errors.issue_date}
              </p>
            )}
          </Field>
          <Field label={secondDateLabel} htmlFor="second_date">
            <input
              id="second_date"
              name="second_date"
              type="date"
              value={formik.values.second_date}
              onChange={formik.handleChange}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-heading text-base font-semibold text-brand-black">
          Line items
        </h2>
        <LineItemsEditor
          items={formik.values.items}
          taxRate={formik.values.tax_rate}
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
          {formik.isSubmitting ? "Saving…" : `Create ${kind}`}
        </Button>
      </div>
    </form>
  );
};
