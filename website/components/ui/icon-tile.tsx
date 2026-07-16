import * as React from "react";
import { cn } from "@lib/utils";

/* Vision UI icon tile — the brand-gradient rounded square that sits beside a
   stat value or an active nav item. */
export const IconTile = ({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    data-slot="icon-tile"
    className={cn(
      "vui-grad inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_4px_16px_-4px_rgba(47,111,196,0.7)] [&_svg]:size-5",
      className,
    )}
    {...props}
  >
    {children}
  </span>
);
