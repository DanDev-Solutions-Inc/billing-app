import { FieldProps } from "@interfaces/components/FieldProps";
import { cx } from "@components/ui/cx";

export const Field = ({ label, htmlFor, children, className }: FieldProps) => (
  /* `min-w-0`: as a flex/grid item this box defaults to `min-width: auto`, so
     it can't shrink below its content's intrinsic width. A native <input
     type="date"> has a wide, non-negotiable min-content size (the spinner
     segments plus the calendar button), so in a narrow column or a modal the
     field pushed past its container instead of shrinking. `fieldBase` already
     sets `min-w-0` on the control itself, but that's defeated while the wrapper
     refuses to shrink. */
  <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {label}
    </label>
    {children}
  </div>
);
