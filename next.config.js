/** @type {import('next').NextConfig} */

// Dev and prod genuinely need different policies, so the CSP is built rather
// than written out as a literal. `next.config.js` is evaluated once per
// process — by `next dev`, by `next build`, and by `next start` — so reading
// NODE_ENV here is reliable: the dev server gets the dev policy, and the
// policy baked into a production build/serve never contains the dev-only
// escape hatches.
const isDev = process.env.NODE_ENV !== 'production'

// WHY NO NONCE.
//
// The textbook Next.js CSP generates a per-request nonce in middleware and
// stamps it onto every inline script. We deliberately do not, for two reasons:
//
//   1. Next 14.2.x has an open advisory (GHSA-ffhc-5mcf-pf4q) covering XSS in
//      App Router apps that use CSP nonces — the nonce can leak into places
//      that let an injected script inherit it, which makes the nonce worse
//      than useless: it buys the false confidence of a "strict" CSP while
//      still executing attacker script. We're pinned at 14.2.35 (see
//      package.json), so we sidestep the whole mechanism instead.
//   2. Nonces have to be minted per request, which means the CSP has to move
//      into middleware.ts and every page becomes dynamic. Our middleware is
//      deliberately scoped to exactly one path (/onboarding); widening it to
//      every request to mint nonces is a real cost for a policy we've just
//      established we don't trust.
//
// The consequence, stated plainly: script-src carries 'unsafe-inline'. Next's
// App Router streams its RSC payload as a sequence of inline
// `<script>self.__next_f.push(...)</script>` tags, and there is no nonce-free,
// hash-free way to allow those (their contents differ per page and per
// render, so hashes can't be precomputed at build time). Without
// 'unsafe-inline' the app ships zero hydration — every page is dead HTML.
//
// So this CSP is not an XSS backstop. What it *is* worth is the origin
// allowlist: it stops an injection from loading attacker script from an
// outside host, stops exfiltration to an outside host via connect-src, and
// stops the page being framed. That is a meaningful reduction in what a
// successful injection can do, and it costs nothing to run.

const cspDirectives = {
  // Everything not named below falls back to same-origin only.
  'default-src': ["'self'"],

  // Locks <base href> so an injection can't re-root every relative URL on the
  // page at an attacker's host.
  'base-uri': ["'self'"],

  // No <object>/<embed>/<applet> anywhere in this app; plugin content is a
  // classic CSP bypass, so deny it outright.
  'object-src': ["'none'"],

  // Clickjacking. frame-ancestors is the modern, CSP-native form; the
  // X-Frame-Options header below says the same thing for anything that only
  // understands the legacy header. Nothing embeds this app in a frame.
  'frame-ancestors': ["'none'"],

  // This app renders no iframes at all (verified: no <iframe> in app/).
  'frame-src': ["'none'"],

  // Every <form> in the app posts to our own API routes or to NextAuth, both
  // same-origin. Pinning this stops an injected form from silently
  // POSTing a student's answers (or credentials) off-site.
  'form-action': ["'self'"],

  'script-src': [
    "'self'",
    // Required, not optional — see the "WHY NO NONCE" note above. Next's RSC
    // flight-data scripts are inline.
    "'unsafe-inline'",
    ...(isDev
      ? [
          // Webpack's dev/HMR runtime evaluates module code via eval(). This
          // is the single most important dev/prod difference in this file: it
          // must never reach a production response.
          "'unsafe-eval'",
          // @vercel/analytics resolves its script host at runtime
          // (getScriptSrc in @vercel/analytics/dist): in development it loads
          // https://va.vercel-scripts.com/v1/script.debug.js, and in
          // production it loads the same-origin /_vercel/insights/script.js
          // that the Vercel edge rewrites in. Hence dev-only.
          'https://va.vercel-scripts.com',
        ]
      : []),
  ],

  // 'unsafe-inline' for styles is intentional and, unlike the script case,
  // not really avoidable with hashes either:
  //   - app/layout.tsx injects a <style> with the selected school's colour
  //     ramp (dangerouslySetInnerHTML). Its contents change with the school,
  //     so no fixed hash exists.
  //   - React `style={{...}}` props all over the app become inline style
  //     *attributes*, and CSS hashes don't cover attributes at all without
  //     'unsafe-hashes' — so a hash-based style-src would break the layout
  //     everywhere while buying nothing.
  //   - SchoolMap's Leaflet popups set style="" inside raw innerHTML.
  // Inline CSS is a far weaker primitive for an attacker than inline JS, and
  // the host allowlist below is still enforced.
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    // app/globals.css line 9 keeps a literal `@import url(...)` to Google
    // Fonts. Next's CSS pipeline inlines *local* @imports but leaves remote
    // ones in the emitted stylesheet, so the browser fetches this host
    // directly. Drop it and every heading falls back to the system sans.
    'https://fonts.googleapis.com',
    // Font Awesome's all.min.css, <link>ed from app/layout.tsx head. The whole
    // icon set in the UI is Font Awesome classes; blocking this host makes
    // every icon vanish.
    'https://cdnjs.cloudflare.com',
  ],

  'font-src': [
    "'self'",
    // The Google Fonts *stylesheet* comes from fonts.googleapis.com (above);
    // the actual woff2 files it points at are served from this separate host.
    // Both are required — allowing only one silently yields no webfont.
    'https://fonts.gstatic.com',
    // Font Awesome ships its glyphs as a webfont referenced relatively from
    // its own stylesheet, so the font files resolve back to cdnjs too.
    // (Observed: /pathway pulls webfonts/fa-solid-900.woff2 from this host the
    // moment the first icon renders — the stylesheet allowance alone is not
    // enough.)
    'https://cdnjs.cloudflare.com',
    // No data: here on purpose. The emitted stylesheets were checked and carry
    // no data: URIs — Next writes bundled font/image assets out to
    // /_next/static/media, which 'self' already covers.
  ],

  'img-src': [
    "'self'",
    // School logos (/logos/*.png), team photos (/team/*.jpg) and Leaflet's
    // bundled sprites are all same-origin, so 'self' handles them. data: is
    // here for one specific, load-bearing reason: Leaflet swaps a tile's src
    // to its 1x1 transparent GIF (L.Util.emptyImageUrl, a data: URI) when
    // retiring a tile. Without this the map logs a violation on every pan.
    'data:',
    // Career profile photography. app/lib/careerPhotos.ts asks the Wikimedia
    // Commons API for images server-side and hands the client the returned
    // `thumburl`, which is always on upload.wikimedia.org. These render
    // through plain <img> in CareerProfileStep, so the browser fetches them
    // and CSP applies.
    'https://upload.wikimedia.org',
    // OpenStreetMap raster tiles for SchoolMap / DemandMap. The component
    // requests https://tile.openstreetmap.org/{z}/{x}/{y}.png explicitly; the
    // wildcard covers the a/b/c. subdomain form in case the tile URL is ever
    // switched back to it.
    'https://tile.openstreetmap.org',
    'https://*.tile.openstreetmap.org',
  ],

  // Every client-side fetch in this app targets our own /api/* routes. The
  // third-party APIs this project uses — Wikimedia, api.zippopotam.us, the
  // Gemini endpoint, BLS — are all called from server code (route handlers),
  // which CSP does not govern, so they must NOT be listed here. Vercel
  // Analytics beacons to the same-origin /_vercel/insights/* path.
  'connect-src': [
    "'self'",
    ...(isDev
      ? [
          // `next dev` runs HMR over a websocket to /_next/webpack-hmr.
          // 'self' does not reliably cover a ws:/wss: scheme in Chromium, so
          // the schemes are named explicitly. Dev only.
          'ws:',
          'wss:',
          'https://va.vercel-scripts.com',
        ]
      : []),
  ],

  // No service worker or web app manifest today; keep both same-origin.
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
}

// NOTE ON upgrade-insecure-requests: deliberately omitted. A lot of the
// catalog data carries plain http:// links to university department pages
// (several famu.edu and fiu.edu subdomains), and this directive upgrades
// outbound navigations as well as subresources — so schools that still don't
// serve https would turn into dead links for students. Our own origin is
// already forced onto https by the Strict-Transport-Security header below,
// which is the part that actually protects this app.
const contentSecurityPolicy = Object.entries(cspDirectives)
  .map(([directive, sources]) => `${directive} ${sources.join(' ')}`.trim())
  .join('; ')

const securityHeaders = [
  {
    // Enforcing, not report-only. Every source above was checked against a
    // production build served by `next start` with the console open: fonts,
    // Font Awesome, the school colour ramp, OSM tiles, Wikimedia photos and
    // hydration all load with zero CSP violations. Shipping it report-only
    // would mean shipping nothing.
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    // Legacy twin of frame-ancestors 'none'. Both are sent because
    // frame-ancestors is ignored by older browsers and X-Frame-Options is
    // ignored by newer ones when a CSP is present — together they cover both.
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Stops content-type sniffing. Matters here because /api/* routes return
    // JSON built partly from model output; without this a browser could be
    // talked into interpreting a response as HTML and executing it.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Full URL to our own origin, origin-only when crossing to https, nothing
    // at all when downgrading to http. Pathway URLs can carry a student's
    // career and school choices, and those shouldn't leak to the university
    // sites we link out to.
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Two years, subdomains included, preload-list eligible. Browsers ignore
    // this header over plain http, so it's inert in local development and
    // only binds on the deployed https origin.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Drop the powerful features this app has no use for. geolocation is
    // explicitly kept for `self`: /schools has a "use my location" control
    // that calls navigator.geolocation.getCurrentPosition
    // (app/components/schools/SchoolsBrowser.tsx), and an empty allowlist
    // there would break distance sorting.
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)',
  },
]

const nextConfig = {
  reactStrictMode: true,

  experimental: {
    // Required on Next 14 for instrumentation.ts to run at all (stable from
    // 15). That file is what boots Sentry on the server and edge runtimes.
    instrumentationHook: true,
  },

  webpack(config) {
    // @sentry/node reaches OpenTelemetry, which loads its instrumentation via
    // a dynamic require() that webpack can't follow — so every build prints
    // "Critical dependency: require function is used in a way in which
    // dependencies cannot be statically extracted". It's a known upstream
    // warning and nothing here is broken by it, but a build that always warns
    // is a build nobody reads the warnings from. Scoped to that one module so
    // a genuinely new warning still shows up.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /node_modules[\\/]require-in-the-middle/ },
    ]
    return config
  },

  async headers() {
    return [
      {
        // Everything: pages, API routes and static assets alike. There is no
        // route in this app that wants a weaker policy, and carving out
        // exceptions is how CSPs quietly stop applying to the page that
        // needed them.
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

// Sentry is wrapped on only when a DSN exists.
//
// Two reasons this is conditional rather than unconditional. A clone of this
// repo with no Sentry account gets the plain config and an unchanged build —
// no webpack plugin, no source-map step, no warnings about a missing auth
// token. And `tunnelRoute` below adds a real route to the app, which there is
// no reason to serve if nothing is reporting to it.
//
// WHY tunnelRoute AT ALL. Sentry's browser SDK normally POSTs directly to
// https://<org>.ingest.sentry.io, which this app's CSP forbids: connect-src is
// 'self' and nothing else, deliberately (see the note above it — the
// third-party APIs are all called from server code, so none of them are
// listed). Adding an ingest host there would be the first exception to that
// rule. Tunnelling routes the events through our own origin instead, so the
// policy is untouched — and as a side effect the reports survive ad blockers,
// which block Sentry's domain by default.
const withSentry = (config) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) return config

  const { withSentryConfig } = require('@sentry/nextjs')

  return withSentryConfig(config, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // The plugin is chatty on every build; let it speak in CI, where someone
    // is reading, and stay quiet locally.
    silent: !process.env.CI,

    // Same-origin path the browser SDK posts events to. Must not collide with
    // an existing route — /monitoring is free (checked against app/).
    tunnelRoute: '/monitoring',

    // Uploading source maps needs an auth token. Without one, skip the upload
    // rather than failing the build: a deploy should not break because
    // observability is half-configured. Stack traces will be minified until
    // SENTRY_AUTH_TOKEN is set.
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },

    // Strips Sentry's own debug logging out of the client bundle.
    disableLogger: true,
  })
}

module.exports = withSentry(nextConfig)
