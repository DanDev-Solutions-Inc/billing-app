import { ButtonVariant } from "@typings/ui/ButtonVariant";

/* shadcn/ui (new-york) button styling, themed to the DanDev palette.
   Variant keys are kept stable (primary/secondary/danger/ghost) so existing
   <Button> / <ButtonLink> call sites keep working unchanged. */
export const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium outline-none transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4";

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  secondary:
    "border border-border bg-surface text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground",
  danger:
    "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30",
  ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
};
