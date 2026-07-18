"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { today } from "@utils/date";
import { upload } from "@vercel/blob/client";
import { createTransactionAction } from "@app/(app)/transactions/actions";
import { transactionSchema } from "@utils/validation/transactionSchema";
import { TransactionFormValues } from "@interfaces/forms/TransactionFormValues";
import { TRANSACTION_CATEGORIES as CATEGORIES, BUSINESS } from "@utils/constants";
import { Card, Field, inputClass, Button, Select, Checkbox } from "@components/ui";
import { Combobox } from "@components/ui/combobox";

export const TransactionForm = ({
  descriptions = [],
}: {
  /** Descriptions already in use — suggestions, not a constraint. */
  descriptions?: string[];
}) => {
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
      tax_included: true,
    },
    validationSchema: transactionSchema,
    onSubmit: async (values, { setStatus }) => {
      const formData = new FormData();

      // Only the upload is guarded. The action must stay OUT of the try:
      // redirect() works by throwing, so catching around it would swallow the
      // navigation and surface "NEXT_REDIRECT" as a failure.
      if (file && file.size > 0) {
        try {
          const blob = await upload(file.name, file, {
            access: "private",
            handleUploadUrl: "/api/receipts/upload",
          });
          formData.set("image_url", blob.url);
          formData.set("image_pathname", blob.pathname);
        } catch (err) {
          setStatus({
            error: err instanceof Error ? err.message : "Upload failed.",
          });
          return;
        }
      }

      formData.set("direction", values.direction);
      formData.set("amount", values.amount);
      formData.set("txn_date", values.txn_date);
      formData.set("category", values.category);
      formData.set("description", values.description);
      formData.set("tax_included", values.tax_included ? "1" : "");
      const result = await createTransactionAction({}, formData);
      if (result?.error) setStatus({ error: result.error });
    },
  });

  const status = formik.status as { error?: string } | undefined;

  const descriptionOptions = descriptions.map((d) => ({ value: d, label: d }));

  return (
    <Card className="p-6">
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
            <Select
              id="category"
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
            >
              <option value="">— None —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Description" htmlFor="description">
          {/* Suggests descriptions already in use so the same vendor doesn't end
              up spelled three ways — but any text is still accepted. */}
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

        {/* On by default — most Ontario CAD money carries HST. Un-tick for the
            exempt and zero-rated: bank fees, insurance, groceries. */}
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

        <Field label="Attach receipt image (optional)" htmlFor="image">
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground hover:file:bg-accent"
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
