import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lib/utils";

/* shadcn/ui (new-york) badge, themed to the DanDev palette. */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium capitalize transition-colors [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-border bg-surface-muted text-muted-foreground",
        outline: "border-border text-foreground",
        success: "border-brand-green/20 bg-brand-green/10 text-brand-green",
        info: "border-brand-accent/20 bg-brand-accent/10 text-brand-accent",
        destructive: "border-brand-red/20 bg-brand-red/10 text-brand-red",
      },
    },
    defaultVariants: { variant: "secondary" },
  },
);

export const Badge = ({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { badgeVariants };
