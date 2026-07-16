"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "@components/nav/sidebar";
import { SidebarProps } from "@interfaces/components/SidebarProps";

export const MobileNav = ({ email }: SidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <div className="flex items-center">
          <Image
            src="/brand/DavdevSolutionsDark.png"
            alt="DanDev Solutions"
            width={1343}
            height={268}
            priority
            className="h-7 w-auto invert"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-foreground transition hover:bg-surface-muted"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
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
          <div className="absolute right-0 top-0 h-full">
            <Sidebar email={email} onNavigate={() => setOpen(false)} />
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute left-4 top-4 rounded-xl border border-glass-border bg-white/[0.06] p-2 text-foreground backdrop-blur-md"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
