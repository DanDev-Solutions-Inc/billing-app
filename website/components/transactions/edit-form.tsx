"use client";

import { useFormik } from "formik";
import { updateTransactionAction } from "@app/(app)/transactions/actions";
import { transactionSchema } from "@utils/validation/transactionSchema";
import { TransactionFormValues } from "@interfaces/forms/TransactionFormValues";
import { TransactionEditFormProps } from "@interfaces/components/TransactionEditFormProps";
import { Field, inputClass, Button, Select, Checkbox } from "@components/ui";
import { Combobox } from "@components/ui/combobox";
import { BUSINESS } from "@utils/constants";

/**
 * Edit one transaction. Formik + Yup, like every other form here — the fields
 * are validated before the action runs rather than relying on the browser.
 */
export const TransactionEditForm = ({
  transaction,
  categories,
  descriptions = [],
}: TransactionEditFormProps) => {
  const formik = useFormik<TransactionFormValues>({
    initialValues: {
      direction: transaction.direction,
      amount: String(transaction.amount),
      txn_date: transaction.txn_date,
      category: transaction.category ?? "",
      description: transaction.description ?? "",
      tax_included: transaction.tax_included ?? true,
    },
    enableReinitialize: true,
    validationSchema: transactionSchema,
    // No try/catch: the action redirects, and redirect() throws to do it —
    // catching here would surface "NEXT_REDIRECT" as a form error.
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.set("id", transaction.id);
      formData.set("direction", values.direction);
      formData.set("amount", values.amount);
      formData.set("txn_date", values.txn_date);
      formData.set("category", values.category);
      formData.set("description", values.description);
      formData.set("tax_included", values.tax_included ? "1" : "");
      await updateTransactionAction(formData);
    },
  });

  const descriptionOptions = descriptions.map((d) => ({ value: d, label: d }));

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="direction">
          <Select
            id="direction"
            name="direction"
            value={formik.values.direction}
            onChange={formik.handleChange}
          >
            <option value="expense">Expense (money out)</option>
            <option value="income">Income (money in)</option>
          </Select>
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
        <Field label="Date" htmlFor="txn_date">
          <input
            id="txn_date"
            name="txn_date"
            type="date"
            value={formik.values.txn_date}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass}
          />
          {formik.touched.txn_date && formik.errors.txn_date && (
            <p className="text-xs text-brand-red">{formik.errors.txn_date}</p>
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

      {/* On by default — most Ontario CAD money carries HST. Un-tick for the
          exempt and zero-rated: bank fees, insurance, groceries, USD invoices.
          This re-splits the same total; it never changes what was paid. */}
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

      <Field label="Description" htmlFor="description">
        <Combobox
          id="description"
          options={descriptionOptions}
          value={formik.values.description}
          onChange={(next) => formik.setFieldValue("description", next)}
          allowCustom
          placeholder="e.g. Uber, Esso…"
          aria-label="Description"
        />
      </Field>

      <div>
        <Button type="submit" variant="secondary" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
};
