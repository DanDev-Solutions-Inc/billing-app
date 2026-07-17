import { ButtonVariant } from "@typings/ui/ButtonVariant";
import { ButtonSize } from "@typings/ui/ButtonSize";

/* Vision UI branded buttons, DanDev palette.

   Shape: pill-ish (rounded-xl), medium weight, generous padding, and a lifted
   shadow on the brand gradient so primary actions read as raised glass.
   Variant keys stay stable (primary/secondary/danger/ghost) so existing call
   sites keep working; `glass` and `outline` are new. */
/* Pill shape is the house style — every button in the app is fully rounded. */
export const buttonBase =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium outline-none transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4";

export const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-9 p-0",
};

export const buttonVariants: Record<ButtonVariant, string> = {
  /* The brand gradient — the one loud element on a navy page. The inset
     white ring gives it a crisp lit edge instead of a flat plastic slab. */
  primary:
    "vui-grad text-white font-semibold ring-1 ring-inset ring-white/20 shadow-[0_6px_20px_-6px_rgba(20,71,131,0.9)] hover:shadow-[0_8px_24px_-6px_rgba(47,111,196,0.9)] hover:brightness-115",
  /* Raised glass — the default for secondary actions on a navy canvas. */
  secondary:
    "border border-glass-border bg-white/[0.06] text-foreground backdrop-blur-md hover:bg-white/[0.12]",
  glass:
    "vui-glass text-foreground hover:border-brand-accent/40 hover:bg-white/[0.08]",
  outline:
    "border border-brand-accent/50 bg-transparent text-brand-accent hover:bg-brand-accent/10",
  /* Solid brand red — irreversible actions state their intent up front. */
  danger:
    "bg-brand-red text-white ring-1 ring-inset ring-white/15 shadow-[0_4px_20px_-6px_rgba(232,97,90,0.7)] hover:brightness-110 focus-visible:ring-destructive/40",
  /* Quiet red — same meaning where a solid fill would shout (table rows). */
  dangerGhost:
    "text-brand-red hover:bg-brand-red/10 focus-visible:ring-destructive/40",
  ghost: "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
};
