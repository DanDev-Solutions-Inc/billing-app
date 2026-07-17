import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@lib/utils";
import { PaginationProps } from "@interfaces/components/PaginationProps";


/** Window of page numbers around the current page, with ellipses. */
const pageWindow = (page: number, pages: number): (number | "…")[] => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pages - 1) out.push("…");
  out.push(pages);
  return out;
};

const linkBase =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50";

export const Pagination = ({
  page,
  pages,
  total,
  from,
  to,
  hrefFor,
  noun = "row",
  variant = "footer",
  className,
}: PaginationProps) => {
  // A single page of results doesn't need controls, but the count still helps.
  const showControls = pages > 1;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        variant === "footer"
          ? "justify-between border-t border-white/[0.06] px-3 py-3 sm:px-6"
          : "justify-between",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        {total === 0 ? (
          `No ${noun}s`
        ) : (
          <>
            <span className="tabular-nums text-foreground">
              {from}–{to}
            </span>{" "}
            of <span className="tabular-nums text-foreground">{total}</span>{" "}
            {noun}
            {total === 1 ? "" : "s"}
          </>
        )}
      </p>

      {showControls && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1)}
              aria-label="Previous page"
              className={cn(linkBase, "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground")}
            >
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span
              aria-hidden
              className={cn(linkBase, "cursor-not-allowed text-muted-foreground/30")}
            >
              <ChevronLeft className="size-4" />
            </span>
          )}

          {pageWindow(page, pages).map((p, i) =>
            p === "…" ? (
              <span
                key={`gap-${i}`}
                className="px-1 text-sm text-muted-foreground/50"
              >
                …
              </span>
            ) : (
              <Link
                key={p}
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  linkBase,
                  "tabular-nums",
                  p === page
                    ? "vui-grad text-white shadow-[0_2px_12px_-2px_rgba(47,111,196,0.6)]"
                    : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                )}
              >
                {p}
              </Link>
            ),
          )}

          {page < pages ? (
            <Link
              href={hrefFor(page + 1)}
              aria-label="Next page"
              className={cn(linkBase, "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground")}
            >
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span
              aria-hidden
              className={cn(linkBase, "cursor-not-allowed text-muted-foreground/30")}
            >
              <ChevronRight className="size-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
};
