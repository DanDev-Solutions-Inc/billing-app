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
  TaxBreakdown,
} from "@components/ui";
import { formatMoney } from "@utils/money";
import { isPdfReceipt } from "@utils/receipt-file";
import { deleteReceipt } from "../actions";
import { ReceiptEditForm } from "@components/receipts/edit-form";
import { RECEIPT_CATEGORIES } from "@utils/constants";
import { DetailProps } from "@interfaces/components/DetailProps";
import { ReceiptPreview } from "@components/receipts/receipt-preview";

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
          {receipt.image_url ? (
            <ReceiptPreview
              src={`/api/receipts/${receipt.id}/file`}
              alt={receipt.vendor ?? "Receipt"}
              isPdf={isPdfReceipt(receipt.image_url)}
              previewClassName="h-[36rem]"
            />
          ) : (
            <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
              No image attached
            </div>
          )}
        </Card>

        <Card className="h-fit p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {formatMoney(receipt.amount)}
              </span>
              <StatusPill status={receipt.source} />
            </div>
            {/* The hero above is the gross; this breaks it down rather than
                restating the total a second time. */}
            <div className="mt-3">
              <TaxBreakdown
                amount={receipt.amount}
                taxIncluded={receipt.tax_included}
                showTotal={false}
              />
            </div>
          </div>

          {/* Editable in place: the image is right there to read the real values
              off, which is exactly when a scan needs correcting. */}
          <ReceiptEditForm receipt={receipt} categories={categoryOptions} />

          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <Detail
              label="Added via"
              value={receipt.source === "email" ? "Email" : "Upload"}
            />
          </div>
        </Card>
      </div>
    </>
  );
};

export default ReceiptPage;
