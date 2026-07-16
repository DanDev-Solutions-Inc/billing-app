import { Card } from "@components/ui/card";
import { IconTile } from "@components/ui/icon-tile";
import { cn } from "@lib/utils";
import { StatCardProps } from "@interfaces/components/StatCardProps";

/* Vision UI stat tile: muted label, big white value, signed delta, and a
   brand-gradient icon tile on the right. */
const TONE = {
  neutral: "text-foreground",
  accent: "text-foreground",
  income: "text-brand-green",
  expense: "text-brand-red",
} as const;

export const StatCard = ({
  label,
  value,
  hint,
  tone = "neutral",
  delta,
  icon,
  className,
}: StatCardProps) => (
  <Card className={cn("px-5 py-4", className)}>
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span
            className={cn(
              "text-2xl font-bold tabular-nums tracking-tight",
              TONE[tone],
            )}
          >
            {value}
          </span>
          {delta && (
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                delta.trim().startsWith("-")
                  ? "text-brand-red"
                  : "text-brand-green",
              )}
            >
              {delta}
            </span>
          )}
        </p>
        {hint && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      {icon && <IconTile>{icon}</IconTile>}
    </div>
  </Card>
);
