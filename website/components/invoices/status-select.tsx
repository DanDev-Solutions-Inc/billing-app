"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@lib/utils";
import { setInvoiceStatus } from "@app/(app)/invoices/actions";
import { InvoiceStatusSelectProps } from "@interfaces/components/InvoiceStatusSelectProps";

/* Mirrors StatusPill's palette so the control reads as the badge it replaces.
   "overdue" isn't here on purpose — it's derived (sent + past due), not a
   status you can set. */
const TONES: Record<string, string> = {
  draft: "border-border bg-surface-muted text-muted-foreground",
  sent: "border-brand-accent/20 bg-brand-accent/10 text-brand-accent",
  paid: "border-brand-green/20 bg-brand-green/10 text-brand-green",
  overdue: "border-brand-red/20 bg-brand-red/10 text-brand-red",
};

const OPTIONS = ["draft", "sent", "paid"] as const;

/**
 * Change an invoice's status from the list, without opening it.
 *
 * Marking paid also books the income transaction (server-side, once), so this
 * is a real state change rather than a label — hence the pending state.
 */
export const InvoiceStatusSelect = ({
  id,
  status,
  overdue,
}: InvoiceStatusSelectProps) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onChange = (next: string) => {
    if (next === status) return;
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", next);
    startTransition(async () => {
      await setInvoiceStatus(formData);
      router.refresh();
    });
  };

  // Overdue is how it reads when unpaid and past due, but the value is "sent".
  const tone = TONES[overdue && status === "sent" ? "overdue" : status];

  return (
    <div className="relative inline-flex">
      <select
        value={status}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Invoice status"
        className={cn(
          "w-fit cursor-pointer appearance-none rounded-md border py-0.5 pl-2 pr-6 text-xs font-medium capitalize outline-none transition disabled:opacity-60",
          "[&>option]:bg-navy-700 [&>option]:text-foreground",
          tone,
        )}
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {overdue && o === "sent" ? "overdue" : o}
          </option>
        ))}
      </select>
      {pending ? (
        <Loader2 className="pointer-events-none absolute right-1 top-1/2 size-3 -translate-y-1/2 animate-spin" />
      ) : (
        <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-3 -translate-y-1/2 opacity-60" />
      )}
    </div>
  );
};
