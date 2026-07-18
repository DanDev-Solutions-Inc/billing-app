"use client";

import { useEffect, useRef, useState } from "react";
import { Expand, ExternalLink, FileText, X } from "lucide-react";
import { cn } from "@lib/utils";
import { ReceiptPreviewProps } from "@interfaces/components/ReceiptPreviewProps";

/**
 * A receipt file (image or PDF) with a click-to-enlarge lightbox.
 *
 * Both detail pages were hand-rolling the same preview markup with slightly
 * different heights and fallbacks; this is that markup, once, plus the viewer.
 *
 * Built on native <dialog> like <Modal> — focus trap, Esc, background inerting
 * and top-layer stacking come free. It isn't <Modal> itself because that one is
 * a padded, max-w-2xl content box: a receipt wants the whole viewport and no
 * chrome competing with the image.
 */
export const ReceiptPreview = ({
  src,
  alt,
  isPdf,
  previewClassName,
}: ReceiptPreviewProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // showModal() is what enables the top layer + focus trap; `open` alone isn't.
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border border-border bg-surface-muted">
        {isPdf ? (
          /* pointer-events-none: a PDF <object> swallows clicks (they go to the
             viewer plugin, not the DOM), so without this the expand button on
             top of it would never fire. */
          <object
            data={src}
            type="application/pdf"
            className={cn("pointer-events-none w-full", previewClassName)}
            aria-label={alt}
          >
            <span className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4" />
              PDF preview unavailable
            </span>
          </object>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt}
            className={cn("w-full object-contain", previewClassName)}
          />
        )}

        {/* Covers the whole preview so the click target matches what you see. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`View ${alt} full size`}
          className="absolute inset-0 flex items-end justify-end p-2 outline-none transition-colors hover:bg-navy-900/20 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="pointer-events-none flex items-center gap-1.5 rounded-lg bg-navy-900/75 px-2 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Expand className="size-3.5" />
            Expand
          </span>
        </button>
      </div>

      <dialog
        ref={ref}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        // Clicking the backdrop is a click on the <dialog> itself, not content.
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        aria-label={alt}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-navy-900/90 p-0 backdrop:bg-navy-900/80 backdrop:backdrop-blur-sm"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
            <p className="min-w-0 truncate text-sm font-medium text-white">
              {alt}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              {/* Always offered, and load-bearing for PDFs on iOS, where an
                  inline <object> often renders nothing at all. */}
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/80 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ExternalLink className="size-3.5" />
                Open in new tab
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-2 text-white/80 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* min-h-0 so this scrolls inside the flex column instead of pushing
              the header off-screen. */}
          <div className="min-h-0 flex-1 overflow-auto p-4 pt-0">
            {isPdf ? (
              <object
                data={src}
                type="application/pdf"
                className="h-full w-full rounded-lg bg-white"
                aria-label={alt}
              >
                <span className="flex h-full flex-col items-center justify-center gap-3 text-sm text-white/80">
                  <FileText className="size-6" />
                  This browser can&rsquo;t display the PDF inline.
                  <a
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-accent underline"
                  >
                    Open it in a new tab
                  </a>
                </span>
              </object>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={src}
                alt={alt}
                className="mx-auto h-full w-auto max-w-full object-contain"
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
};
