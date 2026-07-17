"use client";

import { useFormik } from "formik";
import { updateTransactionAction } from "@app/(app)/transactions/actions";
import { transactionSchema } from "@utils/validation/transactionSchema";
import { TransactionFormValues } from "@interfaces/forms/TransactionFormValues";
import { TransactionEditFormProps } from "@interfaces/components/TransactionEditFormProps";
import { Field, inputClass, Button, Select } from "@components/ui";
import { Combobox } from "@components/ui/combobox";

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
