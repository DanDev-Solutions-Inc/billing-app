"use client";

import { useFormik } from "formik";
import { createTransactionAction } from "@app/(app)/transactions/actions";
import { transactionSchema } from "@utils/validation/transactionSchema";
import { TransactionFormValues } from "@interfaces/forms/TransactionFormValues";
import { Card, Field, inputClass, Button } from "@components/ui";

const today = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

export const TransactionForm = () => {
  const formik = useFormik<TransactionFormValues>({
    initialValues: {
      direction: "expense",
      amount: "",
      txn_date: today(),
      category: "",
      description: "",
    },
    validationSchema: transactionSchema,
    onSubmit: async (values, { setStatus }) => {
      const formData = new FormData();
      formData.set("direction", values.direction);
      formData.set("amount", values.amount);
      formData.set("txn_date", values.txn_date);
      formData.set("category", values.category);
      formData.set("description", values.description);
      const result = await createTransactionAction({}, formData);
      if (result?.error) setStatus({ error: result.error });
    },
  });

  const status = formik.status as { error?: string } | undefined;

  return (
    <Card className="p-6">
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="direction">
            <select
              id="direction"
              name="direction"
              value={formik.values.direction}
              onChange={formik.handleChange}
              className={inputClass}
            >
              <option value="expense">Expense (money out)</option>
              <option value="income">Income (money in)</option>
            </select>
          </Field>
          <Field label="Amount (CAD)" htmlFor="amount">
            <input
              id="amount"
              name="amount"
              type="number"
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
              className={inputClass}
            />
          </Field>
          <Field label="Category" htmlFor="category">
            <input
              id="category"
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Description" htmlFor="description">
          <input
            id="description"
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            className={inputClass}
          />
        </Field>

        {status?.error && <p className="text-sm text-brand-red">{status.error}</p>}

        <div>
          <Button type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? "Saving…" : "Add transaction"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
