import Link from "next/link";
import { Repeat } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ButtonLink,
} from "@components/ui";
import { formatMoney } from "@utils/money";
import { cadenceLabel } from "@utils/cadence";
import { daysUntil, dueLabel } from "@utils/date";
import { RecurringCardProps } from "@interfaces/components/RecurringCardProps";

/**
 * Money that bills itself. Leads with what's coming and when rather than a
 * status column — the next run is the thing you'd actually check.
 */
export const RecurringCard = ({ yearlyRun, upcoming }: RecurringCardProps) => (
  <Card className="flex flex-col">
    <CardHeader className="flex-row items-start justify-between">
      <div>
        <CardTitle>Recurring invoices</CardTitle>
        <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
          {formatMoney(yearlyRun)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          per year · {upcoming.length} active{" "}
          {upcoming.length === 1 ? "schedule" : "schedules"}
        </p>
      </div>
      <Link
        href="/recurring"
        className="shrink-0 text-xs font-medium text-brand-accent hover:underline"
      >
        View all
      </Link>
    </CardHeader>

    <CardContent className="min-h-0 flex-1 pt-0">
      {upcoming.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <p className="text-sm text-muted-foreground">
            No active schedules — set one up to bill a customer automatically.
          </p>
          <ButtonLink href="/recurring/new" variant="secondary" size="sm">
            <Repeat />
            New schedule
          </ButtonLink>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {upcoming.slice(0, 5).map((s) => {
            const overdueRun = daysUntil(s.next_run) < 0;
            return (
              <li key={s.id}>
                <Link
                  href="/recurring"
                  className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:opacity-80"
                >
                  {/* Name owns its own line — cadence and auto-emails
                      beside it squeezed it to "Quality E…" on mobile. The
                      rest stacks underneath as one meta line. */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {s.customers?.name ?? s.title ?? "Untitled"}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${
                        overdueRun
                          ? "font-medium text-brand-red"
                          : "text-muted-foreground"
                      }`}
                    >
                      {[
                        cadenceLabel(s.frequency, s.interval),
                        s.auto_send ? "auto-emails" : null,
                        `Next invoice ${dueLabel(s.next_run)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatMoney(s.total, s.currency)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </CardContent>
  </Card>
);
