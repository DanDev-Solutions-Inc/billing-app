"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Narrow the cash-flow range to 3 months on a phone.
 *
 * It runs on the client because the server can't see the viewport, and it goes
 * through the URL rather than slicing the chart locally: the Income/Expenses/Net
 * totals beneath the chart are computed server-side from the same window, so a
 * client-only trim would leave the bars and the totals disagreeing.
 *
 * Only when no range was chosen — an explicit ?months= is the user's call and
 * is left alone. `replace` keeps it out of history, so Back still leaves the
 * dashboard instead of bouncing between ranges.
 */
export const MobileRangeDefault = ({
  hasExplicitRange,
  mobileMonths = 3,
  breakpoint = 640,
}: {
  hasExplicitRange: boolean;
  mobileMonths?: number;
  breakpoint?: number;
}) => {
  const router = useRouter();

  useEffect(() => {
    if (hasExplicitRange) return;
    if (window.innerWidth >= breakpoint) return;
    router.replace(`/dashboard?months=${mobileMonths}`, { scroll: false });
  }, [hasExplicitRange, mobileMonths, breakpoint, router]);

  return null;
};
