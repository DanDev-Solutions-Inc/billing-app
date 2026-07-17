"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@lib/utils";
import { BackButtonProps } from "@interfaces/components/BackButtonProps";


/**
 * Goes back to wherever you actually came from, rather than a hardcoded
 * parent route — landing on an invoice from the dashboard should return to
 * the dashboard, not to /invoices.
 *
 * `fallbackHref` covers the case where there is no history to pop (opened in
 * a new tab, deep link, or a fresh session), so the control is never a dead end.
 */
export const BackButton = ({
  fallbackHref,
  label = "Back",
  className,
}: BackButtonProps) => {
  const router = useRouter();

  const onBack = () => {
    // >1 means something preceded this page in *this* tab's history.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        "-ml-1 mb-2 inline-flex items-center gap-1 rounded-full py-1 pr-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <ChevronLeft className="size-4" />
      {label}
    </button>
  );
};
