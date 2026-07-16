import { PageHeaderProps } from "@interfaces/components/PageHeaderProps";

export const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-black">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
    {action}
  </div>
);
