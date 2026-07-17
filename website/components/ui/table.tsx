import * as React from "react";
import { cn } from "@lib/utils";

/* Vision UI table: no header fill — just an uppercase muted label row over a
   hairline, with translucent row separators. Wrap in <Card> for the panel. */

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
      // `relative`: positioning context for <RowLink>'s full-row overlay.
      "relative border-b border-white/[0.06] transition-colors hover:bg-white/[0.03] data-[state=selected]:bg-brand-accent/10 [&:has(a[class*=after\\:absolute])]:cursor-pointer",
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
      "h-11 whitespace-nowrap px-3 text-left align-middle text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:px-6 [&:has([role=checkbox])]:pr-0",
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
      "whitespace-nowrap px-3 py-3.5 align-middle sm:px-6 [&:has([role=checkbox])]:pr-0",
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
