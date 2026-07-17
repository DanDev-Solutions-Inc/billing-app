"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
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
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-brand-red/25 bg-brand-red/10 text-brand-red">
          <AlertTriangle className="size-6" />
        </span>
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
            Go to dashboard
          </ButtonLink>
          <Button onClick={reset}>Try again</Button>
        </div>
      </Card>
    </div>
  );
};

export default ErrorBoundary;
