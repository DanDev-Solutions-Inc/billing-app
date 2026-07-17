"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@lib/utils";
import { ModalProps } from "@interfaces/components/ModalProps";


/**
 * Built on the native <dialog> element, which gives focus trapping, Esc to
 * close, background inerting, and top-layer stacking for free — all of which a
 * div-based modal has to reimplement (usually incompletely).
 */
export const Modal = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  className,
}: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // showModal() is what enables the top layer + focus trap; `open` alone doesn't.
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Esc fires `cancel`; the native close is also routed back to state.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      // Clicking the backdrop = clicking the <dialog> itself, not its content.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title || "Dialog"}
      className={cn(
        // whitespace-normal: white-space inherits, and a <dialog> stays a DOM
        // descendant of wherever it's declared even while it renders in the top
        // layer. Opened from inside a `whitespace-nowrap` table cell (the edit
        // buttons are), the title and subtitle inherited nowrap and ran off a
        // phone instead of wrapping. Reset it at the modal boundary.
        "vui-glass m-auto whitespace-normal rounded-[--radius] p-0 text-foreground shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] backdrop:bg-navy-900/70 backdrop:backdrop-blur-sm",
        // A <dialog> is width:fit-content by default, so without an explicit
        // width it grows to its widest line and runs off a phone.
        // `w-[calc(100%-2rem)]` + max-w keeps a margin at every size; the
        // width follows the content, since a one-line confirmation in a 32rem
        // box reads as an empty room.
        "w-[calc(100%-2rem)]",
        size === "sm" && "max-w-md",
        size === "md" && "max-w-lg",
        size === "lg" && "max-w-2xl",
        // A long form (customer + address) is taller than a phone: cap the
        // height and scroll inside, or the fields below the fold are simply
        // unreachable — a <dialog> doesn't scroll the page behind it.
        "max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain",
        className,
      )}
    >
      {/* Inner wrapper stops backdrop clicks from bubbling up as a close. */}
      <div onClick={(e) => e.stopPropagation()}>
        {/* Header sticks so the title and close stay reachable while the body
            scrolls. A ModalResult carries its own headline, so an empty title
            drops the heading and floats just the close button. */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-navy-700/95 px-6 pb-4 pt-5 backdrop-blur-md">
          <div className="min-w-0">
            {title && (
              <h2 className="font-heading text-base font-bold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 ml-auto shrink-0 rounded-full p-1.5 text-muted-foreground outline-none transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </dialog>
  );
};

/**
 * Standard modal action row: right-aligned, cancel before confirm, one gap.
 * Every modal was hand-rolling this with slightly different classes, so the
 * spacing and button order drifted between them.
 */
export const ModalFooter = ({
  className,
  children,
}: React.ComponentProps<"div">) => (
  <div className={cn("mt-5 flex flex-wrap items-center justify-end gap-2", className)}>
    {children}
  </div>
);

/**
 * A finished-action modal: a tone glyph, a headline, an optional detail line,
 * one action centred beneath.
 *
 * Use this for success/result states instead of a boxed <Alert> in the body —
 * the alert repeated what the title already said, so a "Sent" modal read the
 * word twice. Mirrors the error page's language (glyph + message + action) so
 * result states look the same wherever they appear.
 */
const RESULT_TONE = {
  success: "text-brand-green",
  info: "text-brand-accent",
  error: "text-brand-red",
} as const;

export const ModalResult = ({
  tone = "success",
  icon,
  title,
  detail,
  action,
}: {
  tone?: keyof typeof RESULT_TONE;
  icon: React.ReactNode;
  title: string;
  detail?: React.ReactNode;
  action: React.ReactNode;
}) => (
  <div className="flex flex-col items-center gap-4 py-2 text-center">
    <span className={cn("[&_svg]:size-10", RESULT_TONE[tone])}>{icon}</span>
    <div className="space-y-1">
      <p className="font-heading text-base font-bold text-foreground">{title}</p>
      {detail && (
        <p className="break-words text-sm text-muted-foreground">{detail}</p>
      )}
    </div>
    <div className="mt-1 flex justify-center">{action}</div>
  </div>
);
