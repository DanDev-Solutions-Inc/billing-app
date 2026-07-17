"use client";

import { useEffect } from "react";

/* Last-resort boundary: catches errors thrown in the root layout itself.
   It REPLACES the root layout, so it must render its own <html>/<body> and
   cannot rely on globals.css being applied — hence the inline brand styles. */
const GlobalError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #0b1730 0%, #060d1f 100%)",
          color: "#ffffff",
          fontFamily:
            "'neue-haas-grotesk-text', system-ui, -apple-system, sans-serif",
          padding: "1rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            textAlign: "center",
            padding: "1.75rem",
            borderRadius: "1.25rem",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(16,28,56,0.94)",
          }}
        >
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              color: "#9fb0c9",
            }}
          >
            The app hit an unexpected error and couldn&apos;t load.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.75rem",
                color: "rgba(159,176,201,0.6)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "linear-gradient(135deg, #144783 0%, #2f6fc4 100%)",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
