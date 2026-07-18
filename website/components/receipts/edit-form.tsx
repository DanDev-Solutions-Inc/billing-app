"use client";

import { useFormik } from "formik";
import { updateReceiptAction } from "@app/(app)/receipts/actions";
import { receiptEditSchema } from "@utils/validation/receiptEditSchema";
import { ReceiptEditFormValues } from "@interfaces/forms/ReceiptEditFormValues";
import { ReceiptEditFormProps } from "@interfaces/components/ReceiptEditFormProps";
import { Field, inputClass, Button, Select, Checkbox } from "@components/ui";
import { BUSINESS } from "@utils/constants";

/**
 * Correct a receipt's details, with the image beside it.
 *
 * Formik + Yup, like the other forms. Note the linked transaction is a separate
 * record — fixing a receipt here doesn't rewrite the ledger entry it produced.
 */
export const ReceiptEditForm = ({
  receipt,
  categories,
}: ReceiptEditFormProps) => {
  const formik = useFormik<ReceiptEditFormValues>({
    initialValues: {
      vendor: receipt.vendor ?? "",
      amount: String(receipt.amount ?? ""),
      receipt_date: receipt.receipt_date,
      category: receipt.category ?? "",
      notes: receipt.notes ?? "",
      tax_included: receipt.tax_included ?? true,
    },
    enableReinitialize: true,
    validationSchema: receiptEditSchema,
    // The action redirects, and redirect() throws to do it — no try/catch here,
    // or the navigation surfaces as a "NEXT_REDIRECT" error.
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.set("id", receipt.id);
      formData.set("vendor", values.vendor);
      formData.set("amount", values.amount);
      formData.set("receipt_date", values.receipt_date);
      formData.set("category", values.category);
      formData.set("notes", values.notes);
      formData.set("tax_included", values.tax_included ? "1" : "");
      await updateReceiptAction(formData);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vendor" htmlFor="vendor">
          <input
            id="vendor"
            name="vendor"
            value={formik.values.vendor}
            onChange={formik.handleChange}
            className={inputClass}
          />
        </Field>
        <Field label="Amount (CAD)" htmlFor="amount">
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={formik.values.amount}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
          />
          {formik.touched.amount && formik.errors.amount && (
            <p className="text-xs text-brand-red">{formik.errors.amount}</p>
          )}
        </Field>
        <Field label="Date" htmlFor="receipt_date">
          <input
            id="receipt_date"
            name="receipt_date"
            type="date"
            value={formik.values.receipt_date}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
          />
          {formik.touched.receipt_date && formik.errors.receipt_date && (
            <p className="text-xs text-brand-red">{formik.errors.receipt_date}</p>
          )}
        </Field>
        <Field label="Category" htmlFor="category">
          <Select
            id="category"
            name="category"
            value={formik.values.category}
            onChange={formik.handleChange}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Most Ontario purchases carry HST, so this stays on unless the user
          says otherwise — groceries, insurance and bank fees are the exceptions
          worth un-ticking. Toggling it re-splits the same total; it never
          changes what was paid. */}
      <label
        htmlFor="tax_included"
        className="flex items-start gap-2.5 text-sm text-muted-foreground"
      >
        <Checkbox
          id="tax_included"
          name="tax_included"
          checked={formik.values.tax_included}
          onChange={formik.handleChange}
          className="mt-0.5"
        />
        <span>
          Amount includes {BUSINESS.taxLabel} ({BUSINESS.taxRate}%)
        </span>
      </label>

      <Field label="Notes" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={2}
          value={formik.values.notes}
          onChange={formik.handleChange}
          className={inputClass}
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
};
