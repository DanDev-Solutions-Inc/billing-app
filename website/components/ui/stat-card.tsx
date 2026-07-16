import { Card } from "@components/ui/card";
import { cn } from "@lib/utils";
import { StatCardProps } from "@interfaces/components/StatCardProps";

/* Dashboard stat tile — shadcn card surface with a label / value / hint. */
export const StatCard = ({ label, value, hint, className }: StatCardProps) => (
  <Card className={cn("p-5", className)}>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
      {value}
    </p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </Card>
);
