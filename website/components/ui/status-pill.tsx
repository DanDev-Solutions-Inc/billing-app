import { StatusPillProps } from "@interfaces/components/StatusPillProps";
import { cx } from "@components/ui/cx";

/* Vision UI status pill — fully rounded, tinted glass, no heavy fills. */
const statusColors: Record<string, string> = {
  draft: "border-white/10 bg-white/[0.06] text-muted-foreground",
  sent: "border-brand-accent/30 bg-brand-accent/10 text-brand-accent",
  paid: "border-brand-green/30 bg-brand-green/10 text-brand-green",
  accepted: "border-brand-green/30 bg-brand-green/10 text-brand-green",
  declined: "border-brand-red/30 bg-brand-red/10 text-brand-red",
  overdue: "border-brand-red/30 bg-brand-red/10 text-brand-red",
  income: "border-brand-green/30 bg-brand-green/10 text-brand-green",
  expense: "border-brand-red/30 bg-brand-red/10 text-brand-red",
  email: "border-brand-accent/30 bg-brand-accent/10 text-brand-accent",
  upload: "border-white/10 bg-white/[0.06] text-muted-foreground",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  approved: "border-brand-green/30 bg-brand-green/10 text-brand-green",
};

export const StatusPill = ({ status }: StatusPillProps) => (
  <span
    className={cx(
      "inline-flex w-fit items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
      statusColors[status] ?? "border-white/10 bg-white/[0.06] text-muted-foreground",
    )}
  >
    {status}
  </span>
);
