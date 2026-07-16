import { FieldProps } from "@interfaces/components/FieldProps";
import { cx } from "@components/ui/cx";

export const Field = ({ label, htmlFor, children, className }: FieldProps) => (
  <div className={cx("flex flex-col gap-1.5", className)}>
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {label}
    </label>
    {children}
  </div>
);
