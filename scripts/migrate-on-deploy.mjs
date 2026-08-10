// Apply pending migrations, but only on a real production deploy.
//
// The build script used to be `prisma generate && next build`, with nothing
// running `migrate deploy` anywhere — not in CI, not in a postinstall, not in
// vercel.json. Every migration so far has been applied by hand against the
// production database, which worked because someone remembered. The next one
// will be applied by whoever doesn't.
//
// WHY THIS IS GUARDED RATHER THAN INLINE IN THE BUILD SCRIPT. Vercel runs the
// same build command for preview deployments as for production. If previews
// point at the production DATABASE_URL — which they do unless each preview
// gets its own Neon branch — then an unguarded `migrate deploy` would apply a
// branch's migration to production the moment someone opened a pull request,
// before anyone reviewed it. Scoping to VERCEL_ENV === "production" means the
// migration lands exactly when the code that needs it does.
//
// Local `npm run build` skips too, deliberately: building the app should never
// be a thing that quietly alters a database.

import { execSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV;

if (vercelEnv !== "production") {
  console.log(
    `[migrate] skipping — VERCEL_ENV is ${vercelEnv ?? "unset"}, migrations run on production deploys only`
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  // Failing here would break a production deploy over a missing variable that
  // `next build` itself doesn't need. Say so loudly and let the build proceed;
  // the app will fail its own healthcheck soon enough if this was real.
  console.warn("[migrate] DATABASE_URL is not set on a production build — skipping");
  process.exit(0);
}

console.log("[migrate] applying pending migrations");
// Inherit stdio so the migration names and any failure land in the Vercel
// build log. A non-zero exit fails the build, which is the point: shipping
// code whose schema didn't apply is worse than not shipping.
execSync("npx prisma migrate deploy", { stdio: "inherit" });
