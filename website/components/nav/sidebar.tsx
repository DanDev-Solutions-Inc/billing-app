"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@app/(auth)/actions";
import { IconProps } from "@interfaces/components/IconProps";
import { SidebarProps } from "@interfaces/components/SidebarProps";

/* --- inline icons (stroke = currentColor) --------------------------------- */
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

const IconGrid = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const IconDoc = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
);
const IconQuote = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 6a2 2 0 0 1 2-2h8l6 6v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M14 4v6h6M8 14h6" />
  </svg>
);
const IconReceipt = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3z" />
    <path d="M8 8h8M8 12h8" />
  </svg>
);
const IconLedger = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 6h18M3 12h18M3 18h18" />
    <circle cx="8" cy="6" r="0.6" />
    <circle cx="16" cy="12" r="0.6" />
    <circle cx="8" cy="18" r="0.6" />
  </svg>
);
const IconUsers = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0M16 3.5a3 3 0 0 1 0 9M21 20a6 6 0 0 0-4-5.7" />
  </svg>
);
const IconCog = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 9 1.1V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 15 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1A1.6 1.6 0 0 0 22.9 9H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 2z" />
  </svg>
);
const IconLogout = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: IconGrid },
  { href: "/invoices", label: "Invoices", icon: IconDoc },
  { href: "/estimates", label: "Estimates", icon: IconQuote },
  { href: "/receipts", label: "Receipts", icon: IconReceipt },
  { href: "/transactions", label: "Transactions", icon: IconLedger },
  { href: "/customers", label: "Customers", icon: IconUsers },
  { href: "/settings", label: "Settings", icon: IconCog },
];

export const Sidebar = ({ email }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Image
          src="/brand/DDDark.png"
          alt="DanDev"
          width={426}
          height={266}
          className="h-6 w-auto"
        />
        <span className="font-heading text-base font-semibold tracking-tight text-brand-black">
          DanDev Billing
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition " +
                (active
                  ? "bg-brand-accent/10 text-brand-accent"
                  : "text-muted hover:bg-surface-muted hover:text-foreground")
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <p className="truncate px-3 pb-2 text-xs text-muted" title={email}>
          {email}
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-brand-red"
          >
            <IconLogout className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
};
