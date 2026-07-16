import * as React from "react";
import { cn } from "@lib/utils";
import { inputClass } from "@components/ui/input-class";

/* shadcn/ui (new-york) input, themed to the DanDev palette.
   Shares the class string with `inputClass` for legacy call sites. */
export const Input = ({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) => (
  <input
    type={type}
    data-slot="input"
    className={cn(inputClass, "h-9 py-1", className)}
    {...props}
  />
);
