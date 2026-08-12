"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, HandCoins } from "lucide-react";
import {
  Button,
  Modal,
  ModalFooter,
  Field,
  Input,
  Select,
  Alert,
  useToast,
} from "@components/ui";
import { formatMoney } from "@utils/money";
import { PAYMENT_METHODS } from "@utils/constants";
import { recordInvoicePayment } from "@app/(app)/invoices/actions";
import { localNow, toIsoInstant, localDay } from "@utils/local-time";
import { RecordPaymentButtonProps } from "@interfaces/components/RecordPaymentButtonProps";

/**
 * Record what a customer actually sent.
 *
 * The amount starts at the full balance because that's the common case — the
 * modal exists so the exception (a deposit, a partial transfer, a cheque that
 * covers most of it) can be typed over it rather than being impossible.
 */
export const RecordPaymentButton = ({
  id,
  balance,
  currency,
  className,
}: RecordPaymentButtonProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const full = balance.toFixed(2);
  const [amount, setAmount] = useState(full);
  /* Datetime-local wants "YYYY-MM-DDTHH:mm" on the user's own clock, and this
     is a client component, so that's the clock we have. */
  const [when, setWhen] = useState(localNow);
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0].value);

  const openModal = () => {
    /* Reopening after a part payment should offer what's left now, not the
       values from the last time this was filled in. */
    setAmount(full);
    setWhen(localNow());
    setError("");
    setOpen(true);
  };

  const submit = async () => {
    setBusy(true);
    setError("");

    const data = new FormData();
    data.set("id", id);
    data.set("amount", amount);
    data.set("method", method);
    /* The instant to store and the calendar date to file the income under, both
       resolved here: the server runs in UTC and would book a late-evening
       payment on the following day. */
    data.set("paid_at", toIsoInstant(when));
    data.set("paid_on", localDay(when));

    const result = await recordInvoicePayment(data);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    /* Closed on success rather than showing a confirmation panel: the payment
       now appears in the history behind the modal, which says more. The toast
       carries the one thing that isn't obvious there — what's left owing. */
    setOpen(false);
    if (result.ok) toast(result.ok, "success");
    router.refresh();
  };

  const entered = Number(amount);
  const partial = entered > 0 && entered < balance;

  return (
    <>
      <Button type="button" onClick={openModal} className={className}>
        <HandCoins />
        Record payment
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="Record payment"
        description={`${formatMoney(balance, currency)} outstanding on this invoice.`}
      >
        <div className="flex flex-col gap-4">
          <Field label="Amount" htmlFor="payment-amount">
            <Input
              id="payment-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={full}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {partial ? (
                <>
                  Part payment — {formatMoney(balance - entered, currency)} will
                  stay outstanding.{" "}
                  <button
                    type="button"
                    onClick={() => setAmount(full)}
                    className="text-brand-accent underline underline-offset-2"
                  >
                    Pay in full
                  </button>
                </>
              ) : (
                "Paying in full. Change it to record a part payment."
              )}
            </p>
          </Field>

          <Field label="Received" htmlFor="payment-when">
            <Input
              id="payment-when"
              type="datetime-local"
              required
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </Field>

          <Field label="Method" htmlFor="payment-method">
            <Select
              id="payment-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>

          {error && <Alert tone="error">{error}</Alert>}

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={busy || !(entered > 0)}
            >
              {busy ? (
                <>
                  <Loader2 className="animate-spin" />
                  Recording…
                </>
              ) : (
                <>
                  <HandCoins />
                  Record
                </>
              )}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </>
  );
};
