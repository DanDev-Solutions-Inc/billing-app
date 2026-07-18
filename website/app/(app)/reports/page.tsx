import { Metadata } from "next";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Landmark,
  ReceiptText,
  Building2,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@lib/supabase/server";
import { getUserOrRedirect } from "@lib/dal";
import { getFiscalYearSummary } from "@services/supabase/reports";
import {
  PageHeader,
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  Metric,
  EmptyState,
  ButtonLink,
} from "@components/ui";
import { cn } from "@lib/utils";
import { formatMoney, formatDate } from "@utils/money";
import { BUSINESS } from "@utils/constants";

export const metadata: Metadata = { title: "Reports" };

const ReportsPage = async () => {
  /* Started, not awaited — see the note in transactions/page.tsx. RLS scopes
     the query, so blocking here only serialises an auth round-trip. */
  const authGate = getUserOrRedirect();
  const supabase = await createClient();
  const [, years] = await Promise.all([authGate, getFiscalYearSummary(supabase)]);

  /* The fiscal year we're living in — its figures are a running total, not a
     final position, and saying so is the difference between a report you can
     file and one you'd file too early. */
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={`Fiscal years ending August 31. Estimates, not filed returns.`}
      />

      {years.length === 0 ? (
        <EmptyState
          title="Nothing to report yet"
          description="Once there are transactions on the books, each fiscal year's income, HST and corporate tax estimate will appear here."
          action={<ButtonLink href="/transactions">Go to transactions</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6">
          {years.map((y) => {
            const label = `FY${y.fy_end.slice(0, 4)}`;
            const inProgress = y.fy_end >= today;
            /* Negative payable means the ITCs outran the HST collected — a
               refund, not a bill. Worth saying in words: "-$412.00 payable"
               is a figure you have to stop and decode. */
            const refund = y.hst_payable < 0;

            return (
              <Card key={y.fy_end}>
                {/* A native <details> rather than a client component: the whole
                    page is otherwise static server-rendered HTML, and toggling
                    a disclosure isn't worth shipping a hydration boundary for.
                    It also means the closed years are still in the DOM, so
                    ⌘F finds a figure the year hasn't been expanded to show. */}
                <details className="group" open={inProgress}>
                  {/* list-none + the webkit rule drop the default triangle;
                      the chevron below replaces it and can be positioned. */}
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-x-4 rounded-[--radius] px-6 pb-4 pt-5 outline-none transition-colors hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-ring/60 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <CardTitle>
                        {label}
                        {inProgress && (
                          <span className="ml-2 text-xs font-medium text-muted-foreground">
                            in progress
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(y.fy_start)} – {formatDate(y.fy_end)}
                      </CardDescription>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {/* The headline figure stays visible while collapsed —
                          otherwise scanning the years means opening every one.
                          Hidden once expanded, where it'd duplicate the tile
                          three inches below it. */}
                      {/* Hidden when open via an attribute selector, not
                          group-open:hidden — that would sit in the same
                          specificity tier as sm:block and which one wins
                          would come down to CSS source order. */}
                      <span className="hidden text-right sm:block [[open]>summary_&]:hidden">
                        <span className="block text-xs text-muted-foreground">
                          Net income
                        </span>
                        <span
                          className={cn(
                            "block text-sm font-bold tabular-nums",
                            y.net_income >= 0
                              ? "text-brand-green"
                              : "text-brand-red",
                          )}
                        >
                          {formatMoney(y.net_income)}
                        </span>
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </div>
                  </summary>

                  <CardContent className="pb-0">
                    {/* The return's top half: revenue and costs, both net of
                        HST. The HST was never income — it's the CRA's money
                        passing through — so it's reported on its own below. */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Metric
                        label="Income (net of HST)"
                        value={formatMoney(y.income)}
                        icon={<ArrowDownLeft />}
                      />
                      <Metric
                        label="Expenses (net of HST)"
                        value={formatMoney(y.expenses)}
                        icon={<ArrowUpRight />}
                      />
                      <Metric
                        label="Net income"
                        value={formatMoney(y.net_income)}
                        icon={<Wallet />}
                        tone={
                          y.net_income >= 0
                            ? "text-brand-green"
                            : "text-brand-red"
                        }
                      />
                    </div>
                  </CardContent>

                  {/* What's owed. Split off behind a rule because these two are
                      liabilities, not performance — the numbers you set money
                      aside for, rather than the ones you celebrate. */}
                  <div className="mt-5 grid gap-4 border-t border-white/[0.06] px-6 py-4 sm:grid-cols-3">
                    <Metric
                      label={refund ? "HST refund" : "HST payable"}
                      value={formatMoney(Math.abs(y.hst_payable))}
                      icon={<Landmark />}
                      tone={refund ? "text-brand-green" : "text-foreground"}
                    />
                    <Metric
                      label={`Corporate tax (est. ${BUSINESS.corpTaxRate}%)`}
                      value={formatMoney(y.corporate_tax)}
                      icon={<Building2 />}
                    />
                    <Metric
                      label="Total set aside"
                      value={formatMoney(
                        Math.max(y.hst_payable, 0) + y.corporate_tax,
                      )}
                      icon={<ReceiptText />}
                    />
                  </div>

                  {/* The HST working, shown rather than asserted: a payable
                      figure you can't reconcile is one you won't trust at
                      filing time. */}
                  <div className="border-t border-white/[0.06] px-6 py-3 text-xs text-muted-foreground">
                    HST collected {formatMoney(y.hst_collected)} − input tax
                    credits {formatMoney(y.hst_paid)} ={" "}
                    <span className="font-medium text-foreground">
                      {formatMoney(y.hst_payable)}
                    </span>
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}

      {years.length > 0 && (
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Figures are derived from the transaction ledger: amounts are stored
          tax-inclusive, and HST is backed out at {BUSINESS.taxRate}% for every
          transaction not marked exempt. Corporate tax is estimated at{" "}
          {BUSINESS.corpTaxRate}% (Ontario CCPC small business rate) on positive
          net income, and ignores loss carry-forwards, capital cost allowance
          and instalments already paid. Confirm with your accountant before
          filing.
        </p>
      )}
    </>
  );
};

export default ReportsPage;
