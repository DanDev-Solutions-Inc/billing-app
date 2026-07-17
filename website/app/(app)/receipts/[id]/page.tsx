import { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getReceipt } from "@services/supabase/receipt";
import {
  PageHeader,
  Card,
  Button,
  StatusPill,
  Field,
  Select,
  inputClass,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { isPdfReceipt } from "@utils/receipt-file";
import { deleteReceipt, updateReceiptAction } from "../actions";
import { RECEIPT_CATEGORIES } from "@utils/constants";
import { DetailProps } from "@interfaces/components/DetailProps";

export const metadata: Metadata = { title: "Receipt" };

const Detail = ({ label, value }: DetailProps) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-0.5 text-sm text-foreground">{value}</p>
  </div>
);

const ReceiptPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  await getUserOrRedirect();
  const supabase = await createClient();

  const receipt = await getReceipt(supabase, id);
  if (!receipt) notFound();

  /* Keep an imported category that isn't in our list, so saving can't silently
     drop it. */
  const categoryOptions =
    receipt.category &&
    !(RECEIPT_CATEGORIES as readonly string[]).includes(receipt.category)
      ? [receipt.category, ...RECEIPT_CATEGORIES]
      : RECEIPT_CATEGORIES;

  return (
    <>
      <PageHeader
        backHref="/receipts"
        title={receipt.vendor || "Receipt"}
        action={
          <form action={deleteReceipt}>
            <input type="hidden" name="id" value={receipt.id} />
            <Button type="submit" variant="dangerGhost">
              <Trash2 />
              Delete
            </Button>
          </form>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="overflow-hidden">
          {receipt.image_url && isPdfReceipt(receipt.image_url) ? (
            <object
              data={`/api/receipts/${receipt.id}/file`}
              type="application/pdf"
              className="h-[36rem] w-full bg-surface-muted"
            >
              <a
                href={`/api/receipts/${receipt.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="flex h-96 items-center justify-center text-sm text-brand-accent underline"
              >
                Open PDF
              </a>
            </object>
          ) : receipt.image_url ? (
            <div className="min-h-[24rem] bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/receipts/${receipt.id}/file`}
                alt={receipt.vendor ?? "Receipt"}
                className="mx-auto h-auto w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
              No image attached
            </div>
          )}
        </Card>

        <Card className="h-fit p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {formatMoney(receipt.amount)}
            </span>
            <StatusPill status={receipt.source} />
          </div>

          {/* Editable in place: the image is right there to read the real values
              off, which is exactly when a scan needs correcting. */}
          <form action={updateReceiptAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={receipt.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vendor" htmlFor="vendor">
                <input
                  id="vendor"
                  name="vendor"
                  defaultValue={receipt.vendor ?? ""}
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
                  defaultValue={receipt.amount}
                  className={inputClass}
                />
              </Field>
              <Field label="Date" htmlFor="receipt_date">
                <input
                  id="receipt_date"
                  name="receipt_date"
                  type="date"
                  defaultValue={receipt.receipt_date}
                  className={inputClass}
                />
              </Field>
              <Field label="Category" htmlFor="category">
                <Select
                  id="category"
                  name="category"
                  defaultValue={receipt.category ?? ""}
                >
                  <option value="">— None —</option>
                  {categoryOptions.map((c) => (
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
                defaultValue={receipt.notes ?? ""}
                className={inputClass}
              />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <Detail
                label="Added via"
                value={receipt.source === "email" ? "Email" : "Upload"}
              />
              <Button type="submit" variant="secondary">
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
};

export default ReceiptPage;
