"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@components/nav/sidebar";
import { SidebarProps } from "@interfaces/components/SidebarProps";

export const MobileNav = ({ email }: SidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <Link
          href="/dashboard"
          aria-label="DanDev Solutions — go to dashboard"
          className="flex items-center rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Image
            src="/brand/DavdevSolutionsDark.png"
            alt="DanDev Solutions"
            width={1343}
            height={268}
            priority
            className="h-7 w-auto invert"
          />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-foreground transition hover:bg-surface-muted"
        >
          <MenuIcon className="size-6" />
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy-900/70 backdrop-blur-sm"
          />
          {/* Drawer slides in from the right — thumb-reachable next to the
              trigger, which also lives on the right of the top bar. */}
          {/* Full width on a phone (a 64px peek of the page behind is wasted space
              you can't read anyway), capped once there's room to see context. */}
          <div className="absolute right-0 top-0 h-full w-full max-w-sm sm:w-auto">
            <Sidebar
              email={email}
              collapsible={false}
              className="w-full"
              onNavigate={() => setOpen(false)}
            />
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute left-4 top-4 rounded-xl border border-glass-border bg-white/[0.06] p-2 text-foreground backdrop-blur-md"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
};
