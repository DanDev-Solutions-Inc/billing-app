import * as React from "react";
import { cn } from "@lib/utils";

/**
 * The row of filters/search/pager that sits above a list.
 *
 * Every page had this container copy-pasted, so the spacing drifted. One
 * definition instead: children stack full-width on mobile (a phone can't fit
 * search + two filter groups + a pager on one line, and wrapping them made
 * ragged half-width rows), then lay out as a row from sm up.
 */
export const FilterBar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    className={cn(
      "mb-5 flex flex-col items-stretch gap-3 border-b border-border pb-4",
      "sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

/**
 * A group inside <FilterBar> — e.g. the filter controls, or the pager.
 * Same stacking rule, so groups don't reintroduce their own spacing.
 */
export const FilterGroup = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    className={cn(
      "flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
