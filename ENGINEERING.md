# Engineering Overview

A technical walkthrough of Vocation — what it's built on, and more importantly *why* the tricky parts are built the way they are.

The stack list is at the bottom. The interesting part is the middle: the decisions that took real thought, including the ones we got wrong first.

---

## At a glance

| | |
| --- | --- |
| **Scale** | ~41,500 lines of TypeScript across 215 source files |
| **API surface** | 32 route handlers |
| **Tests** | 1,256 across 67 files — no secrets, no database, no network required |
| **History** | 161 commits |
| **Live** | [vocation.bz](https://vocation.bz), deployed on Vercel |

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind · PostgreSQL/Prisma (Neon) · Auth.js v5 · Google Gemini · Sentry · Resend · Vitest

**Data sources:** US Bureau of Labor Statistics · US Dept. of Education College Scorecard · O*NET · scraped university catalogs

---

## The problem that shaped the architecture

An LLM call costs money and takes seconds. A student searching "nurse" shouldn't pay either cost if someone already searched it. That single constraint drove most of the interesting engineering.

### Three cache layers, each solving a different failure

```
1. Committed seed file   data/seed-cache.json — permanent, in the repo
2. In-memory map         fast, but wiped on every cold start
3. Durable KV store      survives cold starts, so a pathway is generated at most once ever
```

Layer 3 exists because layers 1 and 2 have a specific gap: on serverless, route handlers run in short-lived processes with a read-only filesystem. A pathway a student paid a Gemini call for is gone minutes later, and the next student pays again.

It's also **deliberately dependency-free**. Vercel provisions `KV_REST_API_URL` and `KV_REST_API_TOKEN` pointing at an Upstash-compatible REST endpoint that speaks plain JSON over `fetch` — so there's no client library to install, pin, or chase through a rename. Every function degrades to a no-op when those variables are absent, because local dev and CI have no store configured and must behave exactly as they did before the file existed. *A cache is an optimization, and an optimization that can take down a request is a liability.*

### Cache keys are a security boundary, not just a performance detail

The key includes the school, the career, and the route archetype — because "Accountant at MDC" and "Accountant at FIU" are different answers, and sharing one entry would serve whichever was generated first to both.

For AI-discovered schools (ones not in our catalog), the key also includes a **content fingerprint**. Without it, one request carrying fabricated details for a real school's name would overwrite the durable entry every later visitor gets served. Keyed by content, a forged request can only ever read back its own answer.

That was a real bug, found in a security audit and fixed with a regression test.

### Ordering is deliberate

Career-legitimacy checks and rate limiting run **ahead of the cache**, not after. Two reasons, both learned rather than assumed:

- A refused search must cost nothing and must not spend the visitor's allowance.
- An entry generated *before* a policy check existed must not be served *after* it exists.

---

## The rule that runs through everything: never invent data

This is the project's strongest opinion, enforced in code and in tests.

**Missing data shows as missing.** From `scorecard.ts`: a school we have no row for gets no figure — never an estimate standing in for one. The UI distinguishes a real reported `0` from "not available yet" (`!= null`, not truthiness), because a genuine zero is a measurement and blanking it would be a lie of omission.

**Sourced and estimated facts never blur together.** Career pages carry two classes of fact. Wages and employment come from the BLS survey and say so, with a verification badge and the survey year. Everything else — demand commentary, the route in, what practitioners report — is the model's judgement and is labelled as such. *A student can't tell an estimate from a measurement by looking at it, so the page has to tell them.*

**We refused to fake a progress bar.** A design mockup for the generation screen included a percentage driven by a `setInterval` — it would hit 100% before the response landed, or freeze mid-value. Pathway generation is one HTTP round trip with no point where the server reports "40% done," so any percentage would be fiction. The shipped version is an indeterminate ring with status text describing real pipeline stages, holding on the last one rather than looping so it can never re-describe a step already passed.

**We don't republish other people's reviews.** The "what people in the job say" section is a synthesis of recurring themes, explicitly labelled as such, with links out to the real sources. No avatars, no names, no fake quotes — because a face beside a sentence says "a person said this," and no person did. That's an editorial *and* a legal position.

---

## Decisions worth reading

### An allowlist that fails closed

The intake asks for household income to estimate financial aid. That data is **never sent to a server** — `estimateAid()` is a pure function called from a client component, so the aid maths works without the server ever seeing a household income.

When a visitor signs up mid-intake, their answers are carried into the new account. The code that does this uses an explicit allowlist of three fields, not a denylist:

> "Everything except income" is correct right up until the next person adds a field to `IntakeAnswers` — a birth date, a disability status, a parent's employer — at which point a denylist silently starts persisting it and nobody notices. An allowlist fails closed: a new answer is not stored until someone deliberately writes its name here, which is a line a reviewer sees in the diff.

Family financial data, collected from a population that includes minors, stored nowhere. The privacy policy can make that claim because the architecture guarantees it — and a test asserts the allowlist directly rather than through a mocked database call.

### Two hashes, for two different reasons

Passwords use **bcrypt**. Password-reset tokens use **SHA-256**. That's not inconsistency:

bcrypt's cost factor buys resistance to guessing a low-entropy human-chosen secret. A reset token is 32 CSPRNG bytes — not guessable at any cost factor — so the stretching buys nothing. What it *would* cost is real: bcrypt salts per row, so verifying a presented token would mean scanning every outstanding row and running a deliberately slow compare against each. A SHA-256 digest is a plain indexed equality lookup.

The raw token exists only in the email that carried it. A leaked database dump must not be a set of working reset links.

### Login errors that don't leak

"No such email" and "wrong password" return the same response, because a different error for each hands an attacker a working email-enumeration oracle for free. Failed logins are recorded identically in both branches for the same reason — a throttle that only engaged for real accounts would rebuild that oracle out of timing.

Rate limiting is layered: refuse before the database read and the bcrypt compare (past a ceiling, an attacker shouldn't be able to make us do work at all), but *slow* rather than refuse below it, so a correct password still gets through. An account-scoped lockout would be its own vulnerability — a denial-of-service anyone could point at anyone.

### A bug only a real build could catch

`withDbErrors()` wraps all 15 route handlers so a database failure returns a clean 503 instead of a stack trace. The first version swallowed *everything* — including Next.js's own `DynamicServerError`, which the framework throws internally as control flow.

Tests passed. The production build failed. The fix re-throws anything carrying a string `digest` (Next's marker for its own control-flow errors), and the lesson stuck: **tests alone weren't sufficient proof, so `npm run build` is part of the definition of done.**

### A test suite that reads the stylesheet

An entrance animation that starts at `opacity: 0` and relies on `animation-fill-mode: forwards` has a blank-page failure mode: if the animation never runs — CSS blocked, JS off, reduced motion, a crawler — the content is invisible forever.

This happened here, twice, and neither was caught by a type checker or by the other 1,200 tests:

1. The `prefers-reduced-motion` block sat near the top of the stylesheet, **above every rule it was meant to override**. A media query contributes no specificity, so at equal specificity the later declaration wins — the accessibility opt-out did nothing at all, silently, in production.
2. A scroll-reveal class sat at `opacity: 0` until JavaScript added a class. With scripting unavailable, most of the landing page was invisible.

So there's now a suite that parses `globals.css` as text and asserts things a type system can't see: that the reduced-motion block is declared *after* every rule it overrides, that entrance animations carry no static `opacity: 0`, and that animation durations stay inside the designed range. Source order and *the absence of a declaration* are exactly what review misses and what a test can hold.

The site-entry animation is built so the animation's final frame is identical to the element's default computed style — nothing but a running animation can hide it, so every way the animation can fail lands on visible content. Staggered elements use `backwards` rather than `forwards` fill for the same reason.

---

## Testing

**1,256 tests, 67 files, no secrets and no database required.** That last constraint is deliberate: CI runs on every push with no configuration, and a test suite that needs credentials is a test suite people stop running.

Coverage is weighted toward what's expensive to get wrong rather than toward a percentage: rate-limit behaviour, cache-key isolation, the career-legitimacy policy at every route that can generate content, URL validation, database error mapping, and the stylesheet-safety suite above.

Where tests are slow, they're slow on purpose. The signup rate-limit tests run real bcrypt hashes rather than mocks, because mocking the hash would mean no longer testing rate limiting under the real cost these requests incur.

---

## Security and compliance

Two independent security audits were run against the codebase, and everything they found was fixed and regression-tested. Highlights:

- **SSRF prevention** — model-supplied URLs are validated against a scheme allowlist before ever being fetched.
- **Cache poisoning** — the content-fingerprint fix described above.
- **Strict CSP** with no `unsafe-eval` in production, error reporting tunnelled to avoid a third-party `connect-src` exception.
- **Timeouts on every outbound AI call**, so a hung upstream can't hold a request open indefinitely.
- **Account deletion requires the current password**, not just a session cookie — a session rides in a cookie, so anything that can make a same-origin request could otherwise spend it on an irreversible action.

On the compliance side, the app ships **data export and permanent deletion** from account settings, a **13+ age gate enforced server-side** (a client-side checkbox is a courtesy, not a control), and earnings figures labelled with what they actually measure. That last one mattered: the College Scorecard field behind "median earnings" is `10_yrs_after_entry`, which is measured from *entry* rather than graduation, **includes students who never completed**, and is institution-wide rather than per-program. Displayed as a bare number next to a career plan, it reads as "graduates of this program earn this" — a claim the data doesn't support. It's now labelled and footnoted with its source and vintage.

## Accessibility

Audited with Lighthouse against the running application rather than by reading code — which is how the two invisible-content bugs above were found. The landing page and signup flow score **100 with zero failed audits**.

Fixes included a colour-contrast token failing WCAG 1.4.3 at 4.22:1 (used across 28 files, so corrected once at the source), nine pages missing a `<main>` landmark, an `aria-label` that replaced rather than contained its visible text (WCAG 2.5.3), and a touch target under the 24px minimum (WCAG 2.5.8).

---

## What we'd do differently

Worth being honest about:

- **`app/pathway/page.tsx` is 1,649 lines.** It grew organically and should have been decomposed several features ago. A planned rework exists; it wasn't worth the regression risk late in the project.
- **The design system arrived after a lot of the UI did.** Tokens now live in `globals.css`, but early screens were built with ad-hoc values and not all have been migrated.
- **Rate-limit counters live in process memory**, so on serverless each instance counts separately and the limits are approximate. The durable KV store could back them; it doesn't yet.
- **We shipped legal documents that described a different app than the one we built** — claiming institutional ownership the project doesn't have, and routing privacy requests to an inbox we didn't control. Fixed, but it should never have shipped that way, and the lesson is that documentation drifts from code exactly like comments do.

---

## Stack reference

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 14, App Router | Server components keep API keys server-side by default |
| Language | TypeScript (strict) | |
| Styling | Tailwind + CSS custom properties | Tokens support per-school theming at runtime |
| Database | PostgreSQL via Prisma, on Neon | Serverless-friendly; branching for migrations |
| Auth | Auth.js v5 | JWT sessions to avoid a DB round trip per request; Prisma adapter for OAuth linking |
| AI | Google Gemini (Flash) | Cost — heavily cached on top |
| Email | Resend | Falls back to console logging when unconfigured |
| Monitoring | Sentry | No session replay, no default PII |
| Maps | Leaflet | |
| Testing | Vitest | |
| Hosting | Vercel | |

---

## The team

Built by **Christian Orozco**, **Gerald Gelats**, and **Sean Valencia** — started as a Miami Dade College hackathon project and carried well past it into a deployed application with real users.

Commit history is public on the repository for anyone who wants the detail.

---

*Vocation is an independent project, not affiliated with or endorsed by Miami Dade College or any other institution.*
