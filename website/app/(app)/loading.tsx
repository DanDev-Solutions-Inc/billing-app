/**
 * Loading UI for every (app) route.
 *
 * This file is doing more than showing a spinner. Next skips prefetching a
 * dynamic route entirely unless it has a loading boundary — with none, every
 * tap was a cold blocking round-trip that painted nothing until the server
 * answered, which is the "takes a second to think" feeling. From the v16 docs
 * (getting-started/linking-and-navigating): "Dynamic Route: prefetching is
 * skipped, or the route is partially prefetched if loading.tsx is present."
 *
 * So its presence buys three things at once: the shell prefetches, the
 * navigation commits immediately, and this renders while data streams in.
 *
 * Deliberately generic — it stands in for list *and* detail pages, so it
 * suggests "a page is arriving" rather than mimicking one specific layout and
 * mismatching everywhere else.
 */
const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-lg bg-white/[0.06] ${className}`} />
);

const Loading = () => (
  <div className="animate-pulse" aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading…</span>

    {/* Page header: title + action button */}
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <Bar className="h-7 w-40 max-w-full" />
        <Bar className="mt-2 h-4 w-64 max-w-full" />
      </div>
      <Bar className="h-11 w-28 shrink-0 rounded-xl" />
    </div>

    {/* Card with rows — reads as a table on list pages, as fields on detail */}
    <div className="overflow-hidden rounded-2xl border border-glass-border bg-white/[0.04]">
      <div className="border-b border-white/[0.06] p-4">
        <Bar className="h-4 w-32" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-white/[0.06] p-4 last:border-b-0"
        >
          <Bar className="h-4 w-full max-w-[14rem] flex-1" />
          <Bar className="hidden h-4 w-32 sm:block" />
          <Bar className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

export default Loading;
