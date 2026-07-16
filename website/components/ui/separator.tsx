import * as React from "react";
import { cn } from "@lib/utils";

/* Lightweight separator (no Radix dependency). */
export const Separator = ({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
}) => (
  <div
    role="separator"
    aria-orientation={orientation}
    data-slot="separator"
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className,
    )}
    {...props}
  />
);
