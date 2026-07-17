"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@lib/utils";
import { FilterOption } from "@interfaces/components/FilterOption";
import { FilterSelectProps } from "@interfaces/components/FilterSelectProps";


/**
 * Compact native <select> that writes its value to the URL. Native on purpose:
 * it gets the platform's own dropdown (and mobile wheel) for free, with no
 * popover dependency.
 */
export const FilterSelect = ({
  param,
  options,
  value,
  allKey = "all",
  className,
  "aria-label": ariaLabel,
}: FilterSelectProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === allKey) params.delete(param);
    else params.set(param, next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className={cn("relative inline-flex w-full sm:w-auto", className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 appearance-none rounded-xl border border-glass-border bg-white/[0.04] py-2 pl-4 pr-9 text-sm font-medium text-foreground outline-none backdrop-blur-md transition-all hover:bg-white/[0.08] focus-visible:border-brand-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/30 [&>option]:bg-navy-700 [&>option]:text-foreground"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
            {typeof o.count === "number" ? ` (${o.count})` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
};
