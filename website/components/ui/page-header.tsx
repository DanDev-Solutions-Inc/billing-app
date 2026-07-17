import { PageHeaderProps } from "@interfaces/components/PageHeaderProps";
import { BackButton } from "@components/ui/back-button";

export const PageHeader = ({
  title,
  subtitle,
  action,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    {/* basis-64: the title claims a readable width before flex-wrap gives up.
        With only `min-w-0 flex-1` it shrank instead of wrapping, so a row of
        actions squeezed the subtitle into a one-word-per-line column. */}
    <div className="min-w-0 flex-1 basis-64">
      {/* backHref is only the fallback — the control pops real history first. */}
      {backHref && <BackButton fallbackHref={backHref} label={backLabel} />}
      <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
    {/* Full-bleed on mobile — a lone pill floating beside the title reads as
        an afterthought, and thumb targets want the width. Any button group
        inside stretches to match. */}
    {action && (
      <div className="w-full sm:w-auto [&>a]:w-full [&>button]:w-full sm:[&>a]:w-auto sm:[&>button]:w-auto">
        {action}
      </div>
    )}
  </div>
);
