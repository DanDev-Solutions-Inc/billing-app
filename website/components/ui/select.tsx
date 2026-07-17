import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@lib/utils";
import { inputClass } from "@components/ui/input-class";

/* Vision UI select. Native <select> on purpose — it gets the platform's own
   dropdown and mobile wheel for free — but with `appearance-none` so the
   browser's default grey arrow is replaced by our chevron, and the option
   list themed to navy instead of the OS light default. */
export const Select = ({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) => (
  <div className="relative w-full">
    <select
      data-slot="select"
      className={cn(inputClass, "appearance-none pr-10", className)}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
  </div>
);
