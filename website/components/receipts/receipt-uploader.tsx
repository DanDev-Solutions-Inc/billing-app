"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { upload } from "@vercel/blob/client";
import { createReceipt } from "@app/(app)/receipts/actions";
import { receiptSchema } from "@utils/validation/receiptSchema";
import { ReceiptFormValues } from "@interfaces/forms/ReceiptFormValues";
import { Card, Field, inputClass, Button } from "@components/ui";

import { RECEIPT_CATEGORIES as CATEGORIES } from "@utils/constants";

const today = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

export const ReceiptUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setPreview(picked ? URL.createObjectURL(picked) : undefined);
  };

  const formik = useFormik<ReceiptFormValues>({
    initialValues: {
      vendor: "",
      amount: "",
      receipt_date: today(),
      category: "",
      notes: "",
      as_expense: true,
    },
    validationSchema: receiptSchema,
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
        formData.set("vendor", values.vendor);
        formData.set("amount", values.amount);
        formData.set("receipt_date", values.receipt_date);
        formData.set("category", values.category);
        formData.set("notes", values.notes);
        if (values.as_expense) formData.set("as_expense", "on");
        const result = await createReceipt(formData);
        if (result?.error) setStatus({ error: result.error });
      } catch (err) {
        setStatus({
          error: err instanceof Error ? err.message : "Upload failed.",
        });
      }
    },
  });

  const status = formik.status as { error?: string } | undefined;

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_1fr]"
      noValidate
    >
      <Card className="p-6">
        <Field label="Receipt image" htmlFor="image">
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground hover:file:bg-accent"
          />
        </Field>
        {preview && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-80 w-full object-contain bg-surface-muted"
            />
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-6">
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
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="as_expense"
            checked={formik.values.as_expense}
            onChange={formik.handleChange}
            className="h-4 w-4 rounded border-border text-brand-accent"
          />
          Record as an expense transaction
        </label>

        {status?.error && <p className="text-sm text-brand-red">{status.error}</p>}

        <div>
          <Button type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? "Saving…" : "Save receipt"}
          </Button>
        </div>
      </Card>
    </form>
  );
};
