import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listReceipts } from "@services/supabase/receipt";
import { PageHeader, Card, ButtonLink, StatusPill, EmptyState } from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { isPdfReceipt } from "@utils/receipt-file";

export const metadata: Metadata = { title: "Receipts" };

const ReceiptsPage = async () => {
  await getUserOrRedirect();
  const supabase = await createClient();
  const receipts = await listReceipts(supabase);

  return (
    <>
      <PageHeader
        title="Receipts"
        subtitle="Track expenses by photo or forwarded email."
        action={
          <div className="flex gap-2">
            <ButtonLink href="/receipts/import" variant="secondary">
              Bulk import
            </ButtonLink>
            <ButtonLink href="/receipts/new">+ Add receipt</ButtonLink>
          </div>
        }
      />

      {receipts.length === 0 ? (
        <EmptyState
          title="No receipts yet"
          description="Upload a photo of a receipt, or forward one to your receipts inbox."
          action={<ButtonLink href="/receipts/new">+ Add receipt</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {receipts.map((r) => (
            <Link key={r.id} href={`/receipts/${r.id}`}>
              <Card className="overflow-hidden transition hover:shadow-md">
                <div className="relative aspect-[3/4] bg-surface-muted">
                  {r.image_url && !isPdfReceipt(r.image_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/receipts/${r.id}/file`}
                      alt={r.vendor ?? "Receipt"}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : r.image_url ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-10 w-10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                        <path d="M14 3v5h5" />
                      </svg>
                      <span className="text-xs font-medium">PDF</span>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">
                      No image
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <StatusPill status={r.source} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate font-medium text-brand-black">
                    {r.vendor || "Unlabeled"}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between text-sm text-muted">
                    <span>{formatDate(r.receipt_date)}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatMoney(r.amount)}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default ReceiptsPage;
