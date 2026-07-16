import * as React from "react";
import { cn } from "@lib/utils";

/* shadcn/ui (new-york) table, themed to the DanDev palette.
   Wrap in <Card className="overflow-hidden"> for a bordered data surface. */

export const Table = ({
  className,
  ...props
}: React.ComponentProps<"table">) => (
  <div className="relative w-full overflow-x-auto">
    <table
      data-slot="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
);

export const TableHeader = ({
  className,
  ...props
}: React.ComponentProps<"thead">) => (
  <thead
    data-slot="table-header"
    className={cn("[&_tr]:border-b [&_tr]:border-border", className)}
    {...props}
  />
);

export const TableBody = ({
  className,
  ...props
}: React.ComponentProps<"tbody">) => (
  <tbody
    data-slot="table-body"
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
);

export const TableRow = ({
  className,
  ...props
}: React.ComponentProps<"tr">) => (
  <tr
    data-slot="table-row"
    className={cn(
      "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className,
    )}
    {...props}
  />
);

export const TableHead = ({
  className,
  ...props
}: React.ComponentProps<"th">) => (
  <th
    data-slot="table-head"
    className={cn(
      "h-11 whitespace-nowrap bg-muted/40 px-5 text-left align-middle text-xs font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
);

export const TableCell = ({
  className,
  ...props
}: React.ComponentProps<"td">) => (
  <td
    data-slot="table-cell"
    className={cn(
      "whitespace-nowrap px-5 py-3 align-middle [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
);

export const TableCaption = ({
  className,
  ...props
}: React.ComponentProps<"caption">) => (
  <caption
    data-slot="table-caption"
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
);
