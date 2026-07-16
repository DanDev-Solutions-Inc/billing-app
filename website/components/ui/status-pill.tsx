import { StatusPillProps } from "@interfaces/components/StatusPillProps";
import { cx } from "@components/ui/cx";

/* shadcn/ui (new-york) badge shape (rounded-md + hairline border),
   themed to the DanDev status palette. */
const statusColors: Record<string, string> = {
  draft: "border-border bg-surface-muted text-muted-foreground",
  sent: "border-brand-accent/20 bg-brand-accent/10 text-brand-accent",
  paid: "border-brand-green/20 bg-brand-green/10 text-brand-green",
  accepted: "border-brand-green/20 bg-brand-green/10 text-brand-green",
  declined: "border-brand-red/20 bg-brand-red/10 text-brand-red",
  overdue: "border-brand-red/20 bg-brand-red/10 text-brand-red",
  income: "border-brand-green/20 bg-brand-green/10 text-brand-green",
  expense: "border-brand-red/20 bg-brand-red/10 text-brand-red",
  email: "border-brand-accent/20 bg-brand-accent/10 text-brand-accent",
  upload: "border-border bg-surface-muted text-muted-foreground",
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-600",
  approved: "border-brand-green/20 bg-brand-green/10 text-brand-green",
};

export const StatusPill = ({ status }: StatusPillProps) => (
  <span
    className={cx(
      "inline-flex w-fit items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
      statusColors[status] ?? "border-border bg-surface-muted text-muted-foreground",
    )}
  >
    {status}
  </span>
);
