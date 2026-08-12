import { Card, CardHeader, CardTitle, CardContent, ConfirmButton } from "@components/ui";
import { formatMoney, formatDateTime } from "@utils/money";
import { paymentMethodLabel } from "@utils/constants";
import { removeInvoicePayment } from "@app/(app)/invoices/actions";
import { PaymentHistoryProps } from "@interfaces/components/PaymentHistoryProps";

/**
 * What has been received against this invoice, and what's left.
 *
 * Always rendered, even with nothing on it: "$0 of $2,400 · $2,400 outstanding"
 * is the answer to the question the card exists to answer, and a panel that
 * appears only after the first payment makes the invoice look like it has no
 * payment story until it does.
 */
export const PaymentHistory = ({
  payments,
  total,
  paid,
  balance,
  currency,
}: PaymentHistoryProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Payments</CardTitle>
    </CardHeader>
    <CardContent>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing received yet — {formatMoney(balance, currency)} outstanding.
        </p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex items-baseline justify-between gap-x-4 gap-y-1 py-2 first:pt-0"
            >
              <div className="min-w-0">
                <span className="font-medium text-foreground">
                  {paymentMethodLabel(p.method)}
                </span>
                {/* The instant, not just the day: "when did it land" is the
                    point of recording a payment separately from the invoice. */}
                <span className="text-muted-foreground">
                  {" · "}
                  {formatDateTime(p.paid_at)}
                </span>
                {/* Only the rows carried over from "mark as paid" have one. */}
                {p.note && (
                  <span className="mt-0.5 block break-words text-xs text-muted-foreground">
                    {p.note}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="font-medium tabular-nums text-foreground">
                  {formatMoney(p.amount, currency)}
                </span>
                <ConfirmButton
                  action={removeInvoicePayment}
                  id={p.id}
                  title="Delete this payment?"
                  description="The income it booked is removed too, and the invoice goes back to unpaid if this is what covered it."
                  triggerLabel="Delete payment"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Paid</span>
          <span className="tabular-nums">
            {formatMoney(paid, currency)} of {formatMoney(total, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between font-semibold text-foreground">
          <span>Balance</span>
          <span
            className={`tabular-nums ${balance > 0 ? "text-brand-red" : "text-brand-green"}`}
          >
            {formatMoney(balance, currency)}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);
