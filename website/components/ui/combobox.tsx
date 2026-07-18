"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@lib/utils";
import { ComboboxProps } from "@interfaces/components/ComboboxProps";
import { controlHeight } from "@components/ui/input-class";

/**
 * Searchable select. Replaces a native <select> once a list is long enough to
 * scroll (customers), and <datalist> for suggestion fields (line-item
 * descriptions) — datalist can't be styled and behaves differently per browser.
 *
 * Deliberately dependency-free: filter + keyboard nav are a few lines, and no
 * popover library is in the project.
 */
export const Combobox = ({
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyLabel,
  allowCustom = false,
  id,
  name,
  className,
  "aria-label": ariaLabel,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  // With allowCustom the typed text *is* the value, so show it verbatim.
  const display = allowCustom ? value : (selected?.label ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.hint?.toLowerCase().includes(q),
    );
  }, [options, query]);

  // Close when focus leaves the control entirely.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const commit = (next: string) => {
    onChange(next);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => Math.max(0, Math.min(filtered.length - 1, a + delta)));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const pick = filtered[active];
      if (pick) commit(pick.value);
      else if (allowCustom) commit(query);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Real value for anything reading the DOM (e.g. plain form posts) */}
      {name && <input type="hidden" name={name} value={value} />}

      <div className="relative">
        {open && (
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          autoComplete="off"
          value={open ? query : display}
          placeholder={open ? "Type to search…" : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            if (!open) setOpen(true);
            // Free-text fields keep the value in step as you type.
            if (allowCustom) onChange(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            `${controlHeight} w-full rounded-xl border border-glass-border bg-white/[0.04] pr-9 text-sm text-foreground outline-none backdrop-blur-md transition-all placeholder:text-muted-foreground hover:bg-white/[0.08] focus-visible:border-brand-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/30`,
            open ? "pl-9" : "pl-4",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle options"
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="absolute right-0 top-0 flex h-full w-9 items-center justify-center text-muted-foreground"
        >
          <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-glass-border bg-navy-700 py-1 shadow-xl backdrop-blur-md"
        >
          {emptyLabel && !query && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => commit("")}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-muted-foreground hover:bg-white/[0.06]"
              >
                {emptyLabel}
                {!value && <Check className="size-4" />}
              </button>
            </li>
          )}

          {filtered.map((o, i) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(o.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground",
                  i === active && "bg-white/[0.06]",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate">{o.label}</span>
                  {o.hint && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {o.hint}
                    </span>
                  )}
                </span>
                {o.value === value && <Check className="size-4 shrink-0" />}
              </button>
            </li>
          ))}

          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {allowCustom ? "No presets match — your text is kept." : "No matches"}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
