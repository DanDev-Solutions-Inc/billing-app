import * as React from "react";
import { cn } from "@lib/utils";

/* shadcn/ui (new-york) label. */
export const Label = ({
  className,
  ...props
}: React.ComponentProps<"label">) => (
  <label
    data-slot="label"
    className={cn(
      "flex select-none items-center gap-2 text-sm font-medium leading-none text-foreground",
      className,
    )}
    {...props}
  />
);
