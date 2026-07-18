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
      /* Positioning context for <RowLink>'s full-row overlay.

         `relative` alone is NOT enough: WebKit ignores `position` on a <tr>
         (it computes to `static`), so the overlay escaped to the `relative`
         wrapper in <Table> and blanketed the whole table. In Safari and every
         iOS browser that meant a click anywhere — including on the sort
         headers and the select-all box — activated the *last* row's link.

         A no-op `transform` does establish a containing block on a row in
         every engine. `translate(0)` rather than `translateZ(0)`: both fix it,
         but the Z variant promotes every row to its own compositing layer for
         no benefit. Measured in Safari and Chrome; row geometry and the
         wrapper's scroll width are unchanged.

         Side effect: each row is now a stacking context. RowAction's `z-10`
         still wins inside it, and native <dialog> still centres in the top
         layer — both verified.

         The `:has()` rule keys off `data-row-overlay`, which RowLink and
         CustomerRowLink both set. It used to match `a[class*=after\:absolute]`,
         which never compiled at all — the escaped colon inside a Tailwind
         arbitrary variant silently drops the rule, so no row ever showed a
         pointer cursor. An attribute also covers CustomerRowLink, which is a
         <button> (it opens a modal, so there's no href) and would have been
         missed by an `a`-only selector even had it worked. */
      "relative [transform:translate(0)] border-b border-white/[0.06] transition-colors hover:bg-white/[0.03] data-[state=selected]:bg-brand-accent/10 [&:has([data-row-overlay])]:cursor-pointer",
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
