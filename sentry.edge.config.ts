// Edge-runtime error reporting.
//
// Separate from sentry.server.config.ts because the edge runtime is a
// different JS environment with a different Sentry build — the Node SDK's
// integrations (fs, http instrumentation) don't exist there.
//
// This app's only edge surface today is middleware.ts, which is scoped to
// exactly one path (/onboarding). Small, but it's the one piece of code that
// runs before everything else, so a failure there is invisible from anywhere
// else in the stack.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });
}
