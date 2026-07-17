"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@lib/utils";
import { SearchInputProps } from "@interfaces/components/SearchInputProps";

/**
 * Debounced search box that writes `q` to the URL — state stays shareable and
 * back-button friendly, matching the filter controls. Searching happens on the
 * server, so it covers every row, not just the page being rendered.
 */
export const SearchInput = ({
  placeholder = "Search…",
  param = "q",
  className,
}: SearchInputProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(param) ?? "";
  const [value, setValue] = useState(urlValue);
  const [lastUrlValue, setLastUrlValue] = useState(urlValue);
  const isFirst = useRef(true);

  // Re-sync when the URL changes elsewhere (back button, a filter reset).
  // Adjusting state during render rather than in an effect — an effect here
  // would render twice and can cascade.
  if (urlValue !== lastUrlValue) {
    setLastUrlValue(urlValue);
    setValue(urlValue);
  }

  useEffect(() => {
    // Don't re-push the URL we just arrived on.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (value === urlValue) return;

    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set(param, value.trim());
      else params.delete(param);
      params.delete("page"); // new query, new result set — back to page 1

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-glass-border bg-white/[0.04] py-2 pl-9 pr-9 text-sm text-foreground outline-none backdrop-blur-md transition-all placeholder:text-muted-foreground hover:bg-white/[0.08] focus-visible:border-brand-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
};
