import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CurrencyNote,
} from "@components/ui";
import { formatMoney, formatDate } from "@utils/money";
import { isOverdue } from "@utils/invoice";
import { OutstandingCardProps } from "@interfaces/components/OutstandingCardProps";

/**
 * Unpaid invoices — the all-time total, overdue called out inside it, and the
 * invoices themselves. Deliberately not windowed by the dashboard's date range:
 * an unpaid invoice is unpaid regardless of when it was issued.
 */
export const OutstandingCard = ({
  outstanding,
  outstandingInvoices,
  overdue,
  overdueInvoices,
  outstandingSorted,
}: OutstandingCardProps) => (
  <Card className="flex flex-col">
    <CardHeader className="flex-row items-start justify-between">
      <div>
        <CardTitle>Outstanding</CardTitle>
        <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
          {formatMoney(outstanding.cad)}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span>{outstandingInvoices.length} unpaid · all time</span>
          <CurrencyNote total={outstanding} />
        </p>
      </div>
      <Link
        href="/invoices?status=sent"
        className="shrink-0 text-xs font-medium text-brand-accent hover:underline"
      >
        View all
      </Link>
    </CardHeader>

    {overdueInvoices.length > 0 && (
      <div className="mx-6 mb-3 flex items-center justify-between gap-3 rounded-xl border border-brand-red/25 bg-brand-red/10 px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium text-brand-red">
          <AlertTriangle className="size-4" />
          {overdueInvoices.length} overdue
        </span>
        <span className="text-sm font-bold tabular-nums text-brand-red">
          {formatMoney(overdue.cad)}
        </span>
      </div>
    )}

    <CardContent className="min-h-0 flex-1 pt-0">
      {outstandingInvoices.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          Nothing outstanding. Nice.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {outstandingSorted.slice(0, 7).map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:opacity-80"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                      {inv.customers?.name ?? "—"}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {inv.invoice_number || `#${inv.id.slice(0, 8)}`}
                    </span>
                  </span>
                  {/* Due date is the whole point of an unpaid list —
                      it turns red once it's past. */}
                  <span
                    className={`mt-0.5 block text-xs ${
                      isOverdue(inv)
                        ? "font-medium text-brand-red"
                        : "text-muted-foreground"
                    }`}
                  >
                    {inv.due_date
                      ? `${isOverdue(inv) ? "Overdue" : "Due"} ${formatDate(inv.due_date)}`
                      : "No due date"}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatMoney(inv.total, inv.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);
