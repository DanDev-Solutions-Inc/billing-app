import * as React from "react";
import { CardProps } from "@interfaces/components/CardProps";
import { cn } from "@lib/utils";

/* Vision UI card — a glassmorphic panel: translucent navy gradient, hairline
   border, 20px radius. The base <Card> stays a flexible container so existing
   `<Card className="p-6">` call sites keep working; the sub-parts add the
   header/content structure when you want it. */
export const Card = ({ className, children }: CardProps) => (
  <div
    data-slot="card"
    className={cn(
      "vui-glass rounded-[--radius] text-card-foreground shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]",
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
    className={cn("flex flex-col gap-1 px-6 pb-4 pt-5", className)}
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
      "font-heading text-base font-bold leading-none tracking-tight text-foreground",
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
    className={cn("px-6 pb-5", className)}
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
