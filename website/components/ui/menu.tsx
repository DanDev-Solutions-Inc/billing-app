"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@lib/utils";

export interface MenuProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
  /** Align the panel to the trigger's right edge (default) or left. */
  align?: "start" | "end";
}

/**
 * Overflow menu for secondary actions. Dependency-free like the Combobox —
 * outside-click and Esc are a few lines, and no popover library is in the
 * project.
 *
 * The panel is a sibling of the trigger inside a `relative` root, so it escapes
 * nothing: keep it out of `.vui-glass` cards, whose backdrop-filter creates a
 * stacking context that a later card would paint over.
 */
export const Menu = ({
  children,
  label = "More actions",
  className,
  align = "end",
}: MenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-white/[0.06] text-muted-foreground outline-none transition-colors hover:bg-white/[0.12] hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
          open && "bg-white/[0.12] text-foreground",
        )}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          // Any click inside is an action — close after it runs.
          onClick={() => setOpen(false)}
          className={cn(
            "absolute z-50 mt-2 min-w-48 overflow-hidden rounded-xl border border-glass-border bg-navy-700 py-1 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/** A row inside <Menu>. Renders whatever child you give it (link, button, form). */
export const MenuItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    role="menuitem"
    className={cn(
      // Style the interactive child generically so links, buttons and
      // form-submit buttons all look identical in the menu.
      "[&>*]:flex [&>*]:w-full [&>*]:items-center [&>*]:gap-2.5 [&>*]:rounded-none [&>*]:px-3.5 [&>*]:py-2 [&>*]:text-sm [&>*]:font-medium [&>*]:text-muted-foreground [&>*]:transition-colors hover:[&>*]:bg-white/[0.06] hover:[&>*]:text-foreground [&>*]:justify-start [&_svg]:size-4",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

/** Hairline between groups of menu items. */
export const MenuSeparator = () => (
  <div className="my-1 h-px bg-white/[0.08]" />
);
