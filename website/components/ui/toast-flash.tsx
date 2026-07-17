"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useToast } from "@components/ui/toast";
import { TOAST_MESSAGES } from "@utils/toast-messages";

/**
 * Shows the toast a Server Action asked for via `?toast=<key>`, then strips the
 * param so a refresh or back-navigation doesn't replay it.
 *
 * Server Actions redirect, which tears down client state — the URL is what
 * survives, so it carries the message.
 */
export const ToastFlash = () => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = searchParams.get("toast");
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (!key || shown.current === key) return;
    shown.current = key;

    const entry = TOAST_MESSAGES[key];
    if (entry) toast(entry.message, entry.tone);

    // Drop `toast` from the URL, keeping every other param intact.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [key, toast, router, pathname, searchParams]);

  return null;
};
