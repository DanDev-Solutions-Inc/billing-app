/* Vision UI field: translucent navy well with a glass hairline; the border
   lights up brand-blue on focus.

   The bracket rules tame the native controls:
   - calendar-picker-indicator: `color-scheme: dark` (set in globals.css)
     already makes the browser draw this icon light, so do NOT invert it —
     that flips it back to black on navy. Only soften it.
   - inner-spin-button: number steppers are tiny light nubs; drop them.
   - option: the popup list would otherwise be white-on-white. */
export const fieldBase =
  "w-full min-w-0 rounded-xl border border-glass-border bg-white/[0.04] text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus-visible:border-brand-accent/60 focus-visible:bg-white/[0.06] focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&>option]:bg-navy-700 [&>option]:text-foreground";

export const inputClass = `flex ${fieldBase} px-4 py-2.5`;
