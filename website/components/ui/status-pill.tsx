import { StatusPillProps } from "@interfaces/components/StatusPillProps";
import { cx } from "@components/ui/cx";

const statusColors: Record<string, string> = {
  draft: "bg-surface-muted text-muted",
  sent: "bg-brand-accent/10 text-brand-accent",
  paid: "bg-brand-green/10 text-brand-green",
  accepted: "bg-brand-green/10 text-brand-green",
  declined: "bg-brand-red/10 text-brand-red",
  overdue: "bg-brand-red/10 text-brand-red",
  income: "bg-brand-green/10 text-brand-green",
  expense: "bg-brand-red/10 text-brand-red",
  email: "bg-brand-accent/10 text-brand-accent",
  upload: "bg-surface-muted text-muted",
};

export const StatusPill = ({ status }: StatusPillProps) => (
  <span
    className={cx(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
      statusColors[status] ?? "bg-surface-muted text-muted",
    )}
  >
    {status}
  </span>
);
