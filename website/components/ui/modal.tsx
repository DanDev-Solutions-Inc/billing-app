"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

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
      aria-label={title}
      className={cn(
        "vui-glass m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[--radius] p-0 text-foreground shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] backdrop:bg-navy-900/70 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      {/* Inner wrapper stops backdrop clicks from bubbling up as a close. */}
      <div onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-bold tracking-tight text-foreground">
              {title}
            </h2>
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
            className="-mr-1 shrink-0 rounded-full p-1.5 text-muted-foreground outline-none transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
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
