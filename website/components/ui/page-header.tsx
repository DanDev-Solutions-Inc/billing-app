import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeaderProps } from "@interfaces/components/PageHeaderProps";

export const PageHeader = ({
  title,
  subtitle,
  action,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      {backHref && (
        <Link
          href={backHref}
          className="-ml-1 mb-2 inline-flex items-center gap-1 rounded-md py-1 pr-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-4" />
          {backLabel}
        </Link>
      )}
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
    {action}
  </div>
);
