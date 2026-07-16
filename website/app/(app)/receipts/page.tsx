import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listReceipts } from "@services/supabase/receipt";
import { PageHeader, Card, ButtonLink, StatusPill, EmptyState } from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";

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
                  {r.image_url ? (
                    <Image
                      src={r.image_url}
                      alt={r.vendor ?? "Receipt"}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
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
