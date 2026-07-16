"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { upload } from "@vercel/blob/client";
import { createTransactionAction } from "@app/(app)/transactions/actions";
import { transactionSchema } from "@utils/validation/transactionSchema";
import { TransactionFormValues } from "@interfaces/forms/TransactionFormValues";
import { TRANSACTION_CATEGORIES as CATEGORIES } from "@utils/constants";
import { Card, Field, inputClass, Button } from "@components/ui";

const today = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

export const TransactionForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setPreview(picked ? URL.createObjectURL(picked) : undefined);
  };

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
      try {
        const formData = new FormData();
        if (file && file.size > 0) {
          const blob = await upload(file.name, file, {
            access: "private",
            handleUploadUrl: "/api/receipts/upload",
          });
          formData.set("image_url", blob.url);
          formData.set("image_pathname", blob.pathname);
        }
        formData.set("direction", values.direction);
        formData.set("amount", values.amount);
        formData.set("txn_date", values.txn_date);
        formData.set("category", values.category);
        formData.set("description", values.description);
        const result = await createTransactionAction({}, formData);
        if (result?.error) setStatus({ error: result.error });
      } catch (err) {
        setStatus({
          error: err instanceof Error ? err.message : "Failed to save.",
        });
      }
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
            <select
              id="category"
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
              className={inputClass}
            >
              <option value="">— None —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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

        <Field label="Attach receipt image (optional)" htmlFor="image">
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-brand-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-blue"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The image is scanned and any blank fields are filled automatically.
          </p>
        </Field>
        {preview && (
          <div className="overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-64 w-full object-contain bg-surface-muted"
            />
          </div>
        )}

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
