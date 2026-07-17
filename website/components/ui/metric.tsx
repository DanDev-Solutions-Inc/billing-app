import { ReactNode } from "react";
import { IconTile } from "@components/ui/icon-tile";
import { cn } from "@lib/utils";
import { MetricProps } from "@interfaces/components/MetricProps";


/**
 * Compact inline metric: gradient icon tile + label over value. Used where a
 * full StatCard would waste vertical space (chart footers, page headers).
 */
export const Metric = ({
  label,
  value,
  icon,
  tone = "text-foreground",
  className,
}: MetricProps) => (
  <div className={cn("flex items-center gap-3", className)}>
    {icon && (
      <IconTile className="size-9 rounded-lg [&_svg]:size-4">{icon}</IconTile>
    )}
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("truncate text-sm font-bold tabular-nums", tone)}>
        {value}
      </p>
    </div>
  </div>
);
