import * as React from "react";
import { CardProps } from "@interfaces/components/CardProps";
import { cn } from "@lib/utils";

/* shadcn/ui (new-york) card, themed to the DanDev palette.

   The base <Card> stays a flexible container (back-compat with existing
   `<Card className="p-6">…`). The sub-parts add the shadcn header/content
   structure when you want it. */
export const Card = ({ className, children }: CardProps) => (
  <div
    data-slot="card"
    className={cn(
      "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
      className,
    )}
  >
    {children}
  </div>
);

export const CardHeader = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="card-header"
    className={cn(
      "flex flex-col gap-1 border-b border-border px-6 py-5",
      className,
    )}
    {...props}
  />
);

export const CardTitle = ({
  className,
  ...props
}: React.ComponentProps<"h3">) => (
  <h3
    data-slot="card-title"
    className={cn(
      "font-heading text-base font-semibold leading-none tracking-tight text-foreground",
      className,
    )}
    {...props}
  />
);

export const CardDescription = ({
  className,
  ...props
}: React.ComponentProps<"p">) => (
  <p
    data-slot="card-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

export const CardContent = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="card-content"
    className={cn("px-6 py-5", className)}
    {...props}
  />
);

export const CardFooter = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="card-footer"
    className={cn(
      "flex items-center gap-3 border-t border-border px-6 py-4",
      className,
    )}
    {...props}
  />
);
