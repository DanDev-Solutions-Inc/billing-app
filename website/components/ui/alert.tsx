import * as React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@lib/utils";
import { AlertTone } from "@typings/ui/AlertTone";
import { AlertProps } from "@interfaces/components/AlertProps";

/* One shape for every success / error / warning / info message in the app.

   Before this, feedback was ad-hoc: bare `<p className="text-brand-red">` in
   some forms, a custom red callout on the dashboard, a hand-rolled tile on the
   error page. Same idea, four appearances. Route them all through here.

   Icons are lucide (the app's single icon system) and are fixed per tone, so a
   colour is never the only thing distinguishing a success from a failure. */

const TONES: Record<
  AlertTone,
  { icon: React.ElementType; wrap: string; icon_: string }
> = {
  success: {
    icon: CheckCircle2,
    wrap: "border-brand-green/25 bg-brand-green/10 text-brand-green",
    icon_: "text-brand-green",
  },
  error: {
    icon: XCircle,
    wrap: "border-brand-red/25 bg-brand-red/10 text-brand-red",
    icon_: "text-brand-red",
  },
  warning: {
    icon: AlertTriangle,
    wrap: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    icon_: "text-amber-300",
  },
  info: {
    icon: Info,
    wrap: "border-brand-accent/25 bg-brand-accent/10 text-brand-accent",
    icon_: "text-brand-accent",
  },
};

export const Alert = ({
  tone = "info",
  trailing,
  className,
  children,
  ...props
}: AlertProps) => {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium",
        t.wrap,
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon className={cn("size-4 shrink-0", t.icon_)} />
        <span className="min-w-0">{children}</span>
      </span>
      {trailing}
    </div>
  );
};

/** The same tone system at feature size, for full-page states. */
export const AlertIcon = ({
  tone = "info",
  className,
}: {
  tone?: AlertTone;
  className?: string;
}) => {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <span
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-2xl border",
        t.wrap,
        className,
      )}
    >
      <Icon className="size-6" />
    </span>
  );
};
