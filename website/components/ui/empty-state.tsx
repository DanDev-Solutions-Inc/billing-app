import { EmptyStateProps } from "@interfaces/components/EmptyStateProps";
import { Card } from "@components/ui/card";

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    <p className="font-heading text-lg font-semibold text-brand-black">
      {title}
    </p>
    {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
    {action && <div className="mt-1">{action}</div>}
  </Card>
);
