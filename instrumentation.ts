// Next's startup hook. Runs once per runtime, before any request is served.
//
// The two Sentry configs are imported dynamically and per-runtime rather than
// statically at the top of this file, because the Node and edge SDKs are
// different builds: importing the Node one into an edge bundle pulls in
// modules that don't exist there and fails at build time, not at runtime.
//
// Requires `experimental.instrumentationHook` in next.config.js on Next 14
// (it's stable from 15 onward).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
