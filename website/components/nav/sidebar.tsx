"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Repeat,
  FileSignature,
  Receipt,
  ArrowLeftRight,
  Building2,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { logout } from "@app/(auth)/actions";
import { cn } from "@lib/utils";
import {
  useSidebarCollapsed,
  toggleSidebarCollapsed,
} from "@hooks/use-sidebar-collapsed";
import { SidebarProps } from "@interfaces/components/SidebarProps";

/* Icons are lucide across the whole app — these were hand-rolled SVGs, the one
   place that didn't match. */
const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/estimates", label: "Estimates", icon: FileSignature },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/team", label: "Team", icon: UserCog },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar = ({
  email,
  onNavigate,
  collapsible = true,
}: SidebarProps) => {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();

  // The drawer always shows labels — it isn't width-constrained.
  const mini = collapsible && collapsed;

  return (
    <aside
      className={cn(
        "flex h-dvh shrink-0 flex-col border-r border-glass-border bg-sidebar backdrop-blur-2xl transition-[width] duration-200",
        mini ? "w-[76px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex px-5 py-5",
          mini ? "flex-col items-center gap-3 px-0" : "items-center gap-2",
        )}
      >
        {/* The mark is the way home, as it is on every other app.
            Collapsed shows the DD monogram; expanded the full wordmark. */}
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="DanDev Solutions — go to dashboard"
          className="rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Image
            src={mini ? "/brand/DDDark.png" : "/brand/DavdevSolutionsDark.png"}
            alt="DanDev Solutions"
            width={mini ? 426 : 1343}
            height={mini ? 266 : 268}
            priority
            className={cn("w-auto invert", mini ? "h-7" : "h-8")}
          />
        </Link>
      </div>

      <nav className={cn("flex flex-1 flex-col gap-1 py-2", mini ? "px-3" : "px-4")}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              // Native tooltip carries the label once it's hidden.
              title={mini ? label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/60",
                mini && "justify-center px-0",
                active
                  ? "vui-glass font-bold text-foreground shadow-[0_4px_16px_-6px_rgba(0,0,0,0.6)]"
                  : "font-medium text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-all",
                  active
                    ? "vui-grad text-white shadow-[0_4px_12px_-3px_rgba(47,111,196,0.8)]"
                    : "bg-white/[0.06] text-muted-foreground group-hover:text-foreground",
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              {!mini && label}
            </Link>
          );
        })}

        {/* Sits at the end of the nav items: chevron points the way it moves —
            left to collapse, right to expand. */}
        {collapsible && (
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            aria-expanded={!mini}
            aria-label={mini ? "Expand navigation" : "Collapse navigation"}
            title={mini ? "Expand navigation" : "Collapse navigation"}
            className={cn(
              "mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-all hover:bg-white/[0.04] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
              mini && "justify-center px-0",
            )}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-glass-border bg-white/[0.04]">
              {mini ? (
                <ChevronRight className="size-[18px]" />
              ) : (
                <ChevronLeft className="size-[18px]" />
              )}
            </span>
            {!mini && "Collapse"}
          </button>
        )}
      </nav>

      <div
        className={cn(
          "border-t border-glass-border py-3",
          mini ? "px-3" : "px-4",
        )}
      >
        {!mini && (
          <p
            className="truncate px-1 pb-2 text-xs text-muted-foreground"
            title={email}
          >
            {email}
          </p>
        )}
        <form action={logout}>
          <button
            type="submit"
            title={mini ? "Sign out" : undefined}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-all hover:bg-white/[0.04] hover:text-brand-red focus-visible:ring-2 focus-visible:ring-ring/60",
              mini && "justify-center px-0",
            )}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] transition-colors group-hover:bg-brand-red/15">
              <LogOut className="size-[18px]" />
            </span>
            {!mini && "Sign out"}
          </button>
        </form>
      </div>
    </aside>
  );
};
