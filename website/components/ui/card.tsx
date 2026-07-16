import { CardProps } from "@interfaces/components/CardProps";
import { cx } from "@components/ui/cx";

export const Card = ({ className, children }: CardProps) => (
  <div
    className={cx(
      "rounded-2xl border border-border bg-surface shadow-sm",
      className,
    )}
  >
    {children}
  </div>
);
