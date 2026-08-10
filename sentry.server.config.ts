// Server-side error reporting.
//
// Loaded by instrumentation.ts when the Node runtime boots. Everything in the
// app already logs its failures — `[db] request failed`, `[rate-limit] daily
// counter`, `Gemini API Error` — but console.error on Vercel goes to a log
// nobody is watching at 2am. This is the part that turns those into something
// that reaches a person.

import * as Sentry from "@sentry/nextjs";

// Server-only DSN falls back to the public one: they're the same value, and a
// Sentry DSN is not a secret (it's a write-only ingest endpoint). Keeping both
// names means the app works whichever one is set.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// No DSN, no init. Deliberate: local development, CI, and any clone of this
// repo without a Sentry account all run with reporting simply absent, rather
// than with a broken client logging failed transport attempts on every error.
if (dsn) {
  Sentry.init({
    dsn,

    // Errors only. Performance tracing is the thing that quietly eats a free
    // tier — every page view becomes a billable transaction, and this app
    // already knows where its slow paths are (Gemini, BLS, the map). Turn it
    // on deliberately later if there's a question it would answer.
    tracesSampleRate: 0,

    // Never attach IP addresses, cookies, or headers automatically.
    //
    // This is a product decision, not a default worth accepting. Vocation's
    // users are community-college students, some of them minors, and this app
    // deliberately stopped persisting household income for exactly that
    // reason (see intakeAdoption.ts). Shipping their request headers to a
    // third-party processor would undo that on a different axis.
    sendDefaultPii: false,

    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

    // Vercel exposes the deploy SHA; tying an error to a release is what makes
    // "this started three deploys ago" answerable.
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });
}
