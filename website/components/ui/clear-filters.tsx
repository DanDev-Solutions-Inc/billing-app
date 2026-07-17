import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@lib/utils";
import { ClearFiltersProps } from "@interfaces/components/ClearFiltersProps";

/**
 * Resets every filter by linking to the bare path — a plain link, so it needs
 * no client JS and the back button still works. Renders nothing when there's
 * nothing to clear, so it can be dropped into any filter bar unconditionally.
 */
export const ClearFilters = ({
  href,
  active,
  className,
}: ClearFiltersProps) => {
  if (!active) return null;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-glass-border bg-white/[0.04] px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.08] hover:text-foreground",
        className,
      )}
    >
      <X className="size-4" />
      Clear
    </Link>
  );
};
