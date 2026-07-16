import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { listEstimates } from "@services/supabase/estimate";
import {
  PageHeader,
  Card,
  ButtonLink,
  StatusPill,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  FilterTabs,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { parsePeriod, inPeriod, PERIOD_LABEL } from "@utils/period";

export const metadata: Metadata = { title: "Estimates" };

const STATUSES = ["draft", "sent", "accepted", "declined"] as const;

const query = (status: string, period: string) => {
  const p = new URLSearchParams();
  if (status !== "all") p.set("status", status);
  if (period !== "month") p.set("period", period);
  const s = p.toString();
  return s ? `/estimates?${s}` : "/estimates";
};

const EstimatesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; period?: string }>;
}) => {
  await getUserOrRedirect();
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const status =
    params.status && STATUSES.includes(params.status as (typeof STATUSES)[number])
      ? params.status
      : "all";

  const supabase = await createClient();
  const all = await listEstimates(supabase);

  const windowed = all.filter((e) => inPeriod(e.issue_date, period));
  const estimates =
    status === "all" ? windowed : windowed.filter((e) => e.status === status);

  const statusTabs = [
    { key: "all", label: "All", href: query("all", period), count: windowed.length },
    ...STATUSES.map((s) => ({
      key: s,
      label: s[0].toUpperCase() + s.slice(1),
      href: query(s, period),
      count: windowed.filter((e) => e.status === s).length,
    })),
  ];

  const periodTabs = [
    { key: "month", label: "Month", href: query(status, "month") },
    { key: "year", label: "Year", href: query(status, "year") },
    { key: "all", label: "All time", href: query(status, "all") },
  ];

  return (
    <>
      <PageHeader
        title="Estimates"
        subtitle="Quote work before it becomes an invoice."
        action={<ButtonLink href="/estimates/new">+ New estimate</ButtonLink>}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <FilterTabs
          tabs={statusTabs}
          active={status}
          aria-label="Filter by status"
        />
        <FilterTabs
          tabs={periodTabs}
          active={period}
          variant="segmented"
          aria-label="Filter by date range"
        />
      </div>

      {estimates.length === 0 ? (
        <EmptyState
          title={
            all.length === 0
              ? "No estimates yet"
              : "No estimates match these filters"
          }
          description={
            all.length === 0
              ? "Send a quote, then convert it to an invoice when accepted."
              : `Nothing ${status === "all" ? "" : `marked ${status} `}in ${PERIOD_LABEL[period].toLowerCase()}. Try a wider date range.`
          }
          action={
            all.length === 0 ? (
              <ButtonLink href="/estimates/new">+ New estimate</ButtonLink>
            ) : (
              <ButtonLink href="/estimates?period=all" variant="secondary">
                View all time
              </ButtonLink>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Estimate</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimates.map((est) => (
                <TableRow key={est.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/estimates/${est.id}`}
                      className="text-brand-accent hover:underline"
                    >
                      {est.estimate_number || `#${est.id.slice(0, 8)}`}
                    </Link>
                  </TableCell>
                  <TableCell>{est.customers?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(est.issue_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(est.expiry_date)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={est.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(est.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
};

export default EstimatesPage;
