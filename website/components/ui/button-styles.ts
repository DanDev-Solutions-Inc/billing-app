import { ButtonVariant } from "@typings/ui/ButtonVariant";

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:pointer-events-none";

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-accent text-white hover:bg-brand-blue",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-muted",
  danger: "bg-brand-red text-white hover:opacity-90",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
};
