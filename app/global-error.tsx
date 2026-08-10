"use client";

// The last thing between a render crash and a blank white page.
//
// Next renders this INSTEAD of the root layout when an error escapes
// everything else, which is why it has to supply its own <html> and <body> —
// app/layout.tsx never runs. It also means none of the app's chrome is
// available here, so this is deliberately plain: no header, no fonts to fail
// to load, no components that could throw a second time inside the handler
// for the first throw.
//
// WHY THE STYLES ARE LITERAL. globals.css and the school colour ramp are both
// injected by the layout this file replaces, so neither Tailwind classes nor
// var(--outline) can be relied on to resolve here. The values below are the
// DESIGN.md tokens written out longhand, each named in a comment — the same
// convention SchoolMap.tsx uses for its Leaflet popups, which are outside
// React's tree for the same kind of reason. The system font stack is likewise
// deliberate: Hanken Grotesk and Inter arrive via a stylesheet that may be the
// very thing that failed.

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

const SURFACE = "#f7f9fb"; // --surface
const ON_SURFACE = "#191c1e"; // --on-surface
const ON_SURFACE_VARIANT = "#45464d"; // --on-surface-variant
const OUTLINE = "#76777d"; // --outline
const OUTLINE_VARIANT = "#c6c6cd"; // --outline-variant
const PRIMARY = "#000000"; // --primary
const ON_PRIMARY = "#ffffff"; // --on-primary
const SURFACE_LOWEST = "#ffffff"; // --surface-container-lowest

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Reported here rather than left to the SDK's automatic capture: a crash
    // inside the React tree is exactly the case the automatic handlers miss,
    // because React swallows it into the boundary instead of letting it reach
    // window.onerror. Without this line the student sees this page and we
    // never learn it happened.
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px", // --margin-desktop
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: SURFACE,
          color: ON_SURFACE,
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "24px", // type/title
              lineHeight: "32px",
              fontWeight: 600,
              margin: "0 0 8px", // --stack-sm
            }}
          >
            Something went wrong on our end
          </h1>

          <p
            style={{
              fontSize: "18px", // type/body
              lineHeight: "28px",
              color: ON_SURFACE_VARIANT,
              margin: "0 0 24px", // --gutter
            }}
          >
            This isn&apos;t anything you did. The problem has been reported, and
            your saved plans are unaffected.
          </p>

          <div
            style={{
              display: "flex",
              gap: "8px", // --stack-sm
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: "8px 24px",
                borderRadius: "0.5rem", // rounded/lg
                border: "none",
                background: PRIMARY,
                color: ON_PRIMARY,
                fontSize: "14px", // type/label
                fontWeight: 500,
                lineHeight: "20px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>

            <a
              href="/"
              style={{
                padding: "8px 24px",
                borderRadius: "0.5rem", // rounded/lg
                border: `1px solid ${OUTLINE_VARIANT}`,
                background: SURFACE_LOWEST,
                color: ON_SURFACE,
                fontSize: "14px", // type/label
                fontWeight: 500,
                lineHeight: "20px",
                textDecoration: "none",
              }}
            >
              Back to start
            </a>
          </div>

          {/* The digest is Next's own error id. It's safe to show — it carries
              no stack — and it's the one string that lets a student's "it
              broke" be matched to a specific report. */}
          {error.digest && (
            <p
              style={{
                marginTop: "24px", // --gutter
                fontSize: "12px", // type/label-sm
                lineHeight: "16px",
                fontWeight: 600,
                color: OUTLINE,
              }}
            >
              Reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
