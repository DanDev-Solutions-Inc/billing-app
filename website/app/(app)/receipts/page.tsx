import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import {
  listReceipts,
  countReceipts,
} from "@services/supabase/receipt";
import { parsePage, pageOf, RECEIPT_PAGE_SIZE } from "@utils/table";
import { Mail, Upload, Plus, FileText } from "lucide-react";
import {
  PageHeader,
  Card,
  ButtonLink,
  EmptyState,
  FilterTabs,
  FilterBar,
  FilterGroup,
  FilterSelect,
  SearchInput,
  Pagination,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { parsePeriod, periodStartIso, PERIOD_LABEL } from "@utils/period";
import { isPdfReceipt } from "@utils/receipt-file";
import { listReceiptCategories } from "@services/supabase/receipt-category";

export const metadata: Metadata = { title: "Receipts" };

const SOURCES = ["email", "upload"] as const;

/**
 * Build a /receipts link from the full filter state.
 *
 * Every control's href goes through here so switching one filter carries the
 * others — clicking "Emailed" used to drop the search you'd just typed.
 * Defaults stay out of the URL to keep shared links readable.
 */
const query = (f: {
  source: string;
  period: string;
  category: string;
  q: string;
  page?: number;
}) => {
  const p = new URLSearchParams();
  if (f.source !== "all") p.set("source", f.source);
  if (f.period !== "month") p.set("period", f.period);
  if (f.category !== "all") p.set("category", f.category);
  if (f.q) p.set("q", f.q);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `/receipts?${s}` : "/receipts";
};

const ReceiptsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    source?: string;
    period?: string;
    category?: string;
    q?: string;
    page?: string;
  }>;
}) => {
  await getUserOrRedirect();
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const source =
    params.source && SOURCES.includes(params.source as (typeof SOURCES)[number])
      ? params.source
      : "all";
  const q = params.q?.trim() ?? "";

  const supabase = await createClient();
  const page = parsePage(params.page);
  const from = periodStartIso(period);
  const src = source === "all" ? undefined : (source as "email" | "upload");

  /* Validated against the categories the data actually has — an arbitrary
     ?category= would return nothing and read as a bug rather than a typo. */
  const categories = await listReceiptCategories(supabase);
  const category = categories.some((c) => c.category === params.category)
    ? (params.category as string)
    : "all";
  const cat = category === "all" ? undefined : category;

  /* Paged in Postgres. This page renders a card with an <img> per receipt, and
     each of those hits an authenticated route that re-checks auth, reads the
     row and fetches the blob — so rendering all 3,598 meant 3,598 of them. */
  const [result, totalCount, emailCount, uploadCount] = await Promise.all([
    listReceipts(supabase, { source: src, category: cat, search: q, from, page }),
    // The badges count within the *other* filters, so they report what the tab
    // would actually show rather than an all-time total.
    countReceipts(supabase, { from, category: cat, search: q }),
    countReceipts(supabase, { from, category: cat, search: q, source: "email" }),
    countReceipts(supabase, {
      from,
      category: cat,
      search: q,
      source: "upload",
    }),
  ]);
  const receipts = result.rows;
  const paged = pageOf(receipts, result.total, page, RECEIPT_PAGE_SIZE);

  /* Any narrowing — an empty result then means "no matches", not "none yet". */
  const isFiltered = Boolean(
    q || source !== "all" || category !== "all" || period !== "month",
  );

  const rest = { period, category, q };
  const sourceTabs = [
    {
      key: "all",
      label: "All",
      href: query({ ...rest, source: "all" }),
      count: totalCount,
    },
    {
      key: "email",
      label: "Emailed",
      href: query({ ...rest, source: "email" }),
      count: emailCount,
    },
    {
      key: "upload",
      label: "Uploaded",
      href: query({ ...rest, source: "upload" }),
      count: uploadCount,
    },
  ];

  const periodTabs = (["month", "year", "all"] as const).map((key) => ({
    key,
    label: { month: "Month", year: "Year", all: "All time" }[key],
    href: query({ source, category, q, period: key }),
  }));

  return (
    <>
      <PageHeader
        title="Receipts"
        subtitle="Track expenses by photo or forwarded email."
        action={
          // flex-1 so the two split the row on a phone — the header's own
          // w-full only stretches direct children, not these nested in a
          // group. Natural width from sm up.
          <div className="flex gap-2 [&>a]:flex-1 sm:[&>a]:flex-none">
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

      <FilterBar>
        <SearchInput
          placeholder="Search vendor, category or notes…"
          className="w-full sm:max-w-xs"
        />
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
        <FilterGroup>
          <FilterSelect
            param="category"
            value={category}
            aria-label="Filter by category"
            options={[
              { key: "all", label: "All categories" },
              ...categories.map((c) => ({
                key: c.category,
                label: c.category,
                count: c.count,
              })),
            ]}
          />
        </FilterGroup>
        {result.total > 0 && (
          <Pagination
            {...paged}
            hrefFor={(p) => query({ source, period, category, q, page: p })}
            noun="receipt"
            variant="bar"
          />
        )}
      </FilterBar>

      {receipts.length === 0 ? (
        <EmptyState
          /* isFiltered, not a row count: the list is paged in Postgres now, so
             we don't hold every row — and a count purely to word an empty state
             isn't worth the round trip. */
          title={isFiltered ? "No receipts match these filters" : "No receipts yet"}
          description={
            isFiltered
              ? `Nothing in ${PERIOD_LABEL[period].toLowerCase()}. Try a wider date range.`
              : "Upload a photo of a receipt, or forward one to your receipts inbox."
          }
          action={
            !isFiltered ? (
              <ButtonLink href="/receipts/new">
                <Plus />
                Add receipt
              </ButtonLink>
            ) : (
              <ButtonLink href="/receipts" variant="secondary">
                Clear search and filters
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
                      <FileText className="size-10" strokeWidth={1.5} />
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
