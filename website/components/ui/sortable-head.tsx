import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@lib/utils";
import { TableHead } from "@components/ui/table";
import { SortDir } from "@utils/table";

export interface SortableHeadProps {
  label: string;
  /** Column key this header sorts by. */
  sortKey: string;
  /** Currently active sort key + direction. */
  activeKey: string;
  activeDir: SortDir;
  /** Href for sorting by this column in the given direction. */
  href: string;
  className?: string;
  /** Right-align (money columns) — flips the icon to the left of the label. */
  align?: "left" | "right";
}

/**
 * A table header that sorts via a link. Server-rendered: no client JS, and the
 * sorted view is shareable. The idle state shows a muted double-chevron so the
 * column advertises that it's sortable before you hover it.
 */
export const SortableHead = ({
  label,
  sortKey,
  activeKey,
  activeDir,
  href,
  className,
  align = "left",
}: SortableHeadProps) => {
  const active = sortKey === activeKey;
  const Icon = !active ? ChevronsUpDown : activeDir === "asc" ? ChevronUp : ChevronDown;

  return (
    <TableHead className={cn(align === "right" && "text-right", className)}>
      <Link
        href={href}
        aria-sort={active ? (activeDir === "asc" ? "ascending" : "descending") : "none"}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
          align === "right" && "flex-row-reverse",
          active ? "text-foreground" : "hover:text-foreground",
        )}
      >
        {label}
        <Icon
          className={cn(
            "size-3.5 shrink-0 transition-opacity",
            active
              ? "opacity-100"
              : "opacity-40 group-hover:opacity-80",
          )}
        />
      </Link>
    </TableHead>
  );
};
