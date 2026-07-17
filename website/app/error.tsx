"use client";

import { useEffect } from "react";
import { CircleAlert, RotateCw, LayoutGrid } from "lucide-react";
import { Card, Button, ButtonLink } from "@components/ui";

/* Route-level error boundary. Without one, a thrown error renders Next's
   bare fallback (and in dev, the cryptic "missing required error components"). */
const ErrorBoundary = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    // Surface it for whatever collects logs; the digest ties it to the server.
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4">
      <Card className="w-full max-w-md p-7 text-center">
        {/* Plain glyph, not a boxed tile: the tile shape is the nav's
            language, and a red-ringed badge overstates a retryable error. */}
        <CircleAlert
          className="mx-auto mb-3 size-8 text-brand-red/80"
          strokeWidth={1.5}
          aria-hidden
        />
        <h1 className="font-heading text-lg font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          That page hit an unexpected error. Trying again often clears it.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground/60">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-2">
          <ButtonLink href="/dashboard" variant="secondary">
            <LayoutGrid />
            Go to dashboard
          </ButtonLink>
          <Button onClick={reset}>
            <RotateCw />
            Try again
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ErrorBoundary;
