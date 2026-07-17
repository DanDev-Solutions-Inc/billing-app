"use client";

import { useState, useRef } from "react";
import { useFormik } from "formik";
import { today } from "@utils/date";
import { upload } from "@vercel/blob/client";
import { Camera, Upload, Loader2, FileText, Sparkles } from "lucide-react";
import { createReceipt } from "@app/(app)/receipts/actions";
import { receiptSchema } from "@utils/validation/receiptSchema";
import { ReceiptFormValues } from "@interfaces/forms/ReceiptFormValues";
import { ReceiptAnalysis } from "@interfaces/models/ai/ReceiptAnalysis";
import { Card, Field, inputClass, Button, Select } from "@components/ui";
import { RECEIPT_CATEGORIES as CATEGORIES } from "@utils/constants";

export const ReceiptUploader = () => {
  const [preview, setPreview] = useState<string>();
  const [isPdf, setIsPdf] = useState(false);
  const [blob, setBlob] = useState<{ url: string; pathname: string }>();
  const [phase, setPhase] = useState<"idle" | "uploading" | "reading" | "done">(
    "idle",
  );
  const [readError, setReadError] = useState<string>();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    // No try/catch: the upload already happened when the file was picked, so
    // the only call here is the action — and redirect() works by throwing, so
    // catching would swallow the navigation and show "NEXT_REDIRECT" instead.
    onSubmit: async (values, { setStatus }) => {
      const formData = new FormData();
      if (blob) {
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
    },
  });

  // Pick → upload → read → fill. On a phone that's one tap: by the time the
  // camera closes, the details below are populated and ready to save.
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReadError(undefined);
    setIsPdf(file.type === "application/pdf");
    setPreview(URL.createObjectURL(file));
    setPhase("uploading");

    try {
      const uploaded = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/receipts/upload",
      });
      setBlob({ url: uploaded.url, pathname: uploaded.pathname });

      setPhase("reading");
      const res = await fetch("/api/receipts/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: uploaded.url }),
      });
      const { analysis } = (await res.json()) as {
        analysis: ReceiptAnalysis | null;
      };

      if (analysis?.is_receipt) {
        if (analysis.vendor) formik.setFieldValue("vendor", analysis.vendor);
        if (analysis.amount != null)
          formik.setFieldValue("amount", String(Math.abs(analysis.amount)));
        if (analysis.date) formik.setFieldValue("receipt_date", analysis.date);
        if (analysis.category)
          formik.setFieldValue("category", analysis.category);
        // A refund is money coming back, not an expense.
        if (analysis.is_refund) formik.setFieldValue("as_expense", false);
      } else {
        setReadError(
          analysis
            ? "That doesn't look like a receipt — fill in the details below."
            : "Couldn't read it automatically — fill in the details below.",
        );
      }
      setPhase("done");
    } catch (err) {
      setPhase("done");
      setReadError(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const status = formik.status as { error?: string } | undefined;
  const busy = phase === "uploading" || phase === "reading";

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      {/* Capture — the primary action: full-width, thumb-reachable targets */}
      <Card className="p-4 sm:p-6">
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={onFileChange}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            <Camera className="h-5 w-5" />
            Take photo
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-60"
          >
            <Upload className="h-5 w-5" />
            Image or PDF
          </button>
        </div>

        {busy && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {phase === "uploading" ? "Uploading…" : "Reading receipt…"}
          </p>
        )}
        {phase === "done" && !readError && blob && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-brand-green">
            <Sparkles className="h-4 w-4" />
            Details filled in — check them and save.
          </p>
        )}
        {readError && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {readError}
          </p>
        )}

        {preview && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface-muted">
            {isPdf ? (
              <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                <FileText className="h-8 w-8 shrink-0 text-brand-accent" />
                <span className="truncate">PDF attached</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-72 w-full object-contain"
              />
            )}
          </div>
        )}
      </Card>

      {/* Details — prefilled by the scan, still fully editable */}
      <Card className="flex flex-col gap-4 p-4 sm:p-6">
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
          Record as a transaction
        </label>

        {status?.error && <p className="text-sm text-brand-red">{status.error}</p>}

        <Button
          type="submit"
          disabled={formik.isSubmitting || busy}
          className="min-h-12 w-full sm:w-auto"
        >
          {formik.isSubmitting ? "Saving…" : "Save receipt"}
        </Button>
      </Card>
    </form>
  );
};
