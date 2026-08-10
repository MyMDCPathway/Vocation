// Browser-side error reporting.
//
// The half that catches what the server never sees: a hydration mismatch, a
// Leaflet failure on a device we don't have, a render crash that leaves a
// student looking at a blank page. app/global-error.tsx reports those; this
// configures where they go.

import * as Sentry from "@sentry/nextjs";

// Must be NEXT_PUBLIC_ to exist in the browser bundle at all.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Errors only — see sentry.server.config.ts. On the client this also
    // matters for weight: tracing pulls in instrumentation for fetch, history
    // and long tasks, and /schools/[id] is currently 107 kB.
    tracesSampleRate: 0,

    // NO SESSION REPLAY, deliberately, and this one is not about bundle size.
    //
    // Replay records the DOM. This app's DOM contains a student's career
    // ambitions, their location, their education level, and — on the intake
    // screens — the household income questions this project specifically
    // decided not to persist. Recording all of it to a third party would be
    // strictly worse than the storage we removed. If replay is ever wanted,
    // it needs a privacy review and masking rules first, not a default.
    sendDefaultPii: false,

    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // A browser extension throwing inside our page is not our bug, and on a
    // public site it's most of the noise.
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
    ],
  });
}
