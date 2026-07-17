import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listReceipts } from "@services/supabase/receipt";
import { Mail, Upload, Plus } from "lucide-react";
import {
  PageHeader,
  Card,
  ButtonLink,
  EmptyState,
  FilterTabs,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { parsePeriod, inPeriod, PERIOD_LABEL } from "@utils/period";
import { isPdfReceipt } from "@utils/receipt-file";

export const metadata: Metadata = { title: "Receipts" };

const SOURCES = ["email", "upload"] as const;

const query = (source: string, period: string) => {
  const p = new URLSearchParams();
  if (source !== "all") p.set("source", source);
  if (period !== "month") p.set("period", period);
  const s = p.toString();
  return s ? `/receipts?${s}` : "/receipts";
};

const ReceiptsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; period?: string }>;
}) => {
  await getUserOrRedirect();
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const source =
    params.source && SOURCES.includes(params.source as (typeof SOURCES)[number])
      ? params.source
      : "all";

  const supabase = await createClient();
  const all = await listReceipts(supabase);

  const windowed = all.filter((r) => inPeriod(r.receipt_date, period));
  const receipts =
    source === "all" ? windowed : windowed.filter((r) => r.source === source);

  const sourceTabs = [
    { key: "all", label: "All", href: query("all", period), count: windowed.length },
    {
      key: "email",
      label: "Emailed",
      href: query("email", period),
      count: windowed.filter((r) => r.source === "email").length,
    },
    {
      key: "upload",
      label: "Uploaded",
      href: query("upload", period),
      count: windowed.filter((r) => r.source === "upload").length,
    },
  ];

  const periodTabs = [
    { key: "month", label: "Month", href: query(source, "month") },
    { key: "year", label: "Year", href: query(source, "year") },
    { key: "all", label: "All time", href: query(source, "all") },
  ];

  return (
    <>
      <PageHeader
        title="Receipts"
        subtitle="Track expenses by photo or forwarded email."
        action={
          <div className="flex gap-2">
            <ButtonLink href="/receipts/import" variant="secondary" size="sm">
              <Upload />
              Bulk import
            </ButtonLink>
            <ButtonLink href="/receipts/new" size="sm">
              <Plus />
              Add receipt
            </ButtonLink>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <FilterTabs
          tabs={sourceTabs}
          active={source}
          aria-label="Filter by source"
        />
        <FilterTabs
          tabs={periodTabs}
          active={period}
          variant="segmented"
          aria-label="Filter by date range"
        />
      </div>

      {receipts.length === 0 ? (
        <EmptyState
          title={
            all.length === 0 ? "No receipts yet" : "No receipts match these filters"
          }
          description={
            all.length === 0
              ? "Upload a photo of a receipt, or forward one to your receipts inbox."
              : `Nothing in ${PERIOD_LABEL[period].toLowerCase()}. Try a wider date range.`
          }
          action={
            all.length === 0 ? (
              <ButtonLink href="/receipts/new">
                <Plus />
                Add receipt
              </ButtonLink>
            ) : (
              <ButtonLink href="/receipts?period=all" variant="secondary">
                View all time
              </ButtonLink>
            )
          }
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
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
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
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div
                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md border border-border bg-background/80 text-muted-foreground backdrop-blur-sm"
                    title={r.source === "email" ? "Emailed in" : "Uploaded"}
                  >
                    {r.source === "email" ? (
                      <Mail className="size-3.5" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    <span className="sr-only">
                      {r.source === "email" ? "Emailed in" : "Uploaded"}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate font-medium text-foreground">
                    {r.vendor || "Unlabeled"}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between text-sm text-muted-foreground">
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
