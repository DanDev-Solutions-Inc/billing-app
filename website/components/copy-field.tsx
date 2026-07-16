"use client";

import { useState } from "react";
import { CopyFieldProps } from "@interfaces/components/CopyFieldProps";

export const CopyField = ({ value }: CopyFieldProps) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — the value is still selectable.
    }
  };

  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm">
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-muted"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};
