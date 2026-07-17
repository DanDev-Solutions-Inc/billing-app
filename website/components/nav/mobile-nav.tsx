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
              trigger, which also lives on the right of the top bar.

              Full-bleed on a phone: the sliver of page left showing behind it
              was unreadable anyway. Capped from sm up, where there's enough
              width for that peek to actually give you context. */}
          <div className="absolute inset-y-0 right-0 w-full sm:max-w-sm">
            {/* h-full, not the Sidebar's own h-dvh: dvh tracks the visual
                viewport, but this overlay is inset-0 against the layout
                viewport. While Safari's toolbar is up the two disagree and the
                panel stops short of the bottom. */}
            <Sidebar
              email={email}
              collapsible={false}
              className="h-full w-full"
              onNavigate={() => setOpen(false)}
            />
          </div>
          {/* Sits over the drawer's own header, opposite the logo — at full
              bleed there's no backdrop left to put it on. */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-5 rounded-xl border border-glass-border bg-white/[0.06] p-2 text-foreground backdrop-blur-md"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
};
