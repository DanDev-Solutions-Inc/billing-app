import Link from "next/link";
import { cn } from "@lib/utils";
import { FilterTabsProps } from "@interfaces/components/FilterTabsProps";


/**
 * Server-rendered, link-based filter control. State lives in the URL, so it is
 * shareable, back-button friendly, and needs no client JS.
 */
export const FilterTabs = ({
  tabs,
  active,
  variant = "chips",
  className,
  "aria-label": ariaLabel,
}: FilterTabsProps) => (
  <nav
    aria-label={ariaLabel}
    className={cn(
      /* Each group takes its own row on a phone — as inline-flex they ignored
         the FilterBar's stretch and wrapped into ragged part-rows. Segmented
         controls divide their row evenly so the options stay tappable. */
      "flex w-full items-center sm:inline-flex sm:w-auto",
      variant === "segmented"
        ? "gap-0.5 rounded-xl border border-glass-border bg-white/[0.04] p-1 backdrop-blur-md [&>a]:flex-1 [&>a]:justify-center sm:[&>a]:flex-none"
        : /* Chips fill the row on a phone (flex-1) so they read as a control
             rather than a ragged left huddle; natural width from sm up. */
          "gap-1 [&>a]:flex-1 [&>a]:justify-center sm:flex-wrap sm:[&>a]:flex-none sm:[&>a]:justify-start",
      className,
    )}
  >
    {tabs.map((t) => {
      const isActive = t.key === active;
      return (
        <Link
          key={t.key}
          href={t.href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
            variant === "segmented"
              ? "rounded-full px-3 py-1"
              : "rounded-full px-3 py-1.5",
            isActive
              ? variant === "segmented"
                ? "vui-grad text-white shadow-[0_2px_12px_-2px_rgba(47,111,196,0.6)]"
                : "bg-brand-accent/15 text-brand-accent"
              : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
          )}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span
              className={cn(
                "text-xs tabular-nums",
                isActive
                  ? variant === "segmented"
                    ? "text-white/70"
                    : "text-brand-accent/70"
                  : "text-muted-foreground/60",
              )}
            >
              {t.count}
            </span>
          )}
        </Link>
      );
    })}
  </nav>
);
