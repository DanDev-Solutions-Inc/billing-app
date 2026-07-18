import Link from "next/link";
import { cn } from "@lib/utils";
import { RowLinkProps } from "@interfaces/components/RowLinkProps";


/**
 * Makes the whole table row open this link.
 *
 * It stays a real <a> and stretches its hit area with an absolutely positioned
 * `::after`, rather than wrapping the row in an anchor (invalid inside <tr>) or
 * putting an onClick on the row (kills middle-click, ⌘-click, focus and the
 * status-bar preview).
 *
 * Requirements:
 * - the <TableRow> must be `relative` (the kit's TableRow already is)
 * - any other control in the row needs `relative z-10` to sit above the overlay
 *   — `RowAction` does this.
 */
export const RowLink = ({ className, children, ...props }: RowLinkProps) => (
  <Link
    /* Marks this as a row-wide overlay so <TableRow> can show the pointer
       cursor. A plain attribute, not a class-substring match: the old
       `[&:has(a[class*=after\:absolute])]` never compiled — the escaped colon
       inside a Tailwind arbitrary variant silently dropped the rule, so no row
       has had a pointer cursor. */
    data-row-overlay=""
    className={cn(
      "font-medium text-foreground outline-none transition-colors after:absolute after:inset-0 after:content-[''] hover:text-brand-accent focus-visible:after:ring-2 focus-visible:after:ring-ring/50",
      className,
    )}
    {...props}
  >
    {children}
  </Link>
);

/**
 * Wrapper for controls that must stay clickable on a row with a RowLink —
 * delete buttons, checkboxes, secondary links. Lifts them above the overlay.
 */
export const RowAction = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => (
  <div className={cn("relative z-10 flex items-center", className)} {...props}>
    {children}
  </div>
);
