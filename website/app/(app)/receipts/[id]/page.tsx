import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getReceipt } from "@services/supabase/receipt";
import { PageHeader, Card, Button, StatusPill } from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { isPdfReceipt } from "@utils/receipt-file";
import { deleteReceipt } from "../actions";
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

  return (
    <>
      <PageHeader
        backHref="/receipts"
        backLabel="Receipts"
        title={receipt.vendor || "Receipt"}
        action={
          <form action={deleteReceipt}>
            <input type="hidden" name="id" value={receipt.id} />
            <Button type="submit" variant="ghost">
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
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Vendor" value={receipt.vendor || "—"} />
            <Detail label="Date" value={formatDate(receipt.receipt_date)} />
            <Detail label="Category" value={receipt.category || "—"} />
            <Detail
              label="Added via"
              value={receipt.source === "email" ? "Email" : "Upload"}
            />
          </div>
          {receipt.notes && (
            <div className="mt-4">
              <Detail label="Notes" value={receipt.notes} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default ReceiptPage;
