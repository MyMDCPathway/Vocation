# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: a person deciding how to get into a career, at any stage of life.**
Not only traditional college-age students. The intake's education levels run
from "still in high school" through "graduate degree," and the finances step
asks whether the person is supported by family or supports themselves — both
because career changers and returning adults are a real part of the audience,
not an edge case.

**Geography is staged, not fixed.** The ambition is global. Florida is the
current pilot region and the only place the product holds real scraped program
catalogs (53 institutions). National expansion is the next intended step.
Anywhere outside a catalogued region, the product already plans against any
school on earth via URL-verified generation, at a stated lower confidence.

Miami Dade College is the origin, not the boundary. It is one of the 53
catalogued schools and gets no special standing in the 2.0 flow.

## Product Purpose

A person names a career; the product returns a complete, costed, step-by-step
route into it — which program at which institution, which transfers, which
licensing exams, and where the real entry gate is an apprenticeship, an
enlistment, or an audition rather than a degree. Up to three routes are priced
and compared side by side.

The gap it fills: picking a major is hard when you cannot see where it leads,
and almost nobody gets an end-to-end picture of how programs, transfers,
licences, and advanced degrees actually connect.

**Success is a real public launch.** This is intended to ship as a product with
real users, not as a demo or a portfolio piece.

## Positioning

**Every program named in a plan is either drawn from a real scraped catalog or
has had its URL fetched and checked server-side before the student sees it.**

That is the mechanism a neighbouring product could not truthfully copy. Generic
AI career advice invents plausible-sounding degrees that do not exist; early
versions of this product did exactly that, and instructing the model to "be
accurate" did not fix it. Constraining the model's output space to a real
catalog did. Where no catalog exists, the model must state each program's URL
and the server verifies it — including soft-404 detection — before rendering,
and reports anything unconfirmed as unconfirmed.

Second differentiator: **the route is classified before anything is planned.**
Not every career runs through college. A welder, an enlistee, and a performer
are not shown universities.

## Operating Context

A visitor answers a nine-step intake in order: career → career specifics (only
when the stated career is too vague to plan) → career profile → location →
education level → finances → schools → budget priority → work mobility. Each
question is its own screen; the intake persists between steps so a refresh does
not discard answers.

Step order is load-bearing. The career profile — the screen most likely to make
someone decide the job is not for them — runs early, before the effortful
questions. Location precedes the planning questions so pay, demand, and the
entry route describe the person's own market rather than a national average.

Supporting context the product reads or produces:

- Location resolves to real coordinates via a postal-code lookup, which is what
  makes "closest to home" mean anything outside Florida.
- Wage percentiles and employment counts come from the Bureau of Labor
  Statistics for the person's own metro area, with model estimates as a labelled
  fallback.
- Career profile imagery comes from Wikipedia/Commons media lists, credited and
  licence-named in the caption. The model never supplies an image URL.
- The 1.0 flow (`/pathway` school-first search, `/career-discovery` quiz) is
  still live and linked.

## Capabilities and Constraints

**Confirmed functionality**

- Career-to-route planning with up to three priced routes compared side by side.
- Route-archetype classification (degree, credential, apprenticeship,
  enlistment, talent) that steers every later question and the plan itself.
- Real program catalogs for 53 of Florida's 61 accredited institutions —
  roughly 5,200 programs (HANDOFF.md records 5,173 across 38 catalog files),
  most with real per-program URLs.
- Open-world planning for any school anywhere, with server-side URL
  verification and a stated confidence level.
- Licensing and certification steps with links to official sources.
- Cost estimates carrying an honesty flag: `listed` (a figure curated for that
  specific school) or `sector` (a band for the school's sector).
- US-only financial-aid estimation (Pell, FAFSA, Bright Futures), gated by
  country code so it is never shown to someone who cannot apply.
- An interactive map of schools.
- A "what fits me" career quiz (1.0 flow).
- **Accounts.** Email/password signup and login, plus Google and LinkedIn
  OAuth (the buttons render regardless, but only function once their app
  credentials are configured — see `.env.example`). A visitor's in-progress
  sessionStorage intake is carried into the account at signup rather than
  discarded (`app/lib/intakeAdoption.ts`). Onboarding collects interests,
  goals, and a privacy setting (Private / Mentors Only / Public). Settings
  management (edit profile, password change, 2FA, notification prefs, data
  export/deletion) is designed but not yet built — a named next milestone, not
  an oversight.

**Technical constraints**

- Next.js 14 App Router, React 18, TypeScript, Tailwind, Vitest. Google Gemini
  (`gemini-flash-latest`, a floating alias on purpose) for generation.
- **One real database, added deliberately and only for this.** Pathway data is
  still a committed JSON seed file, an in-memory layer, an optional Redis/KV
  durable layer, and a school cookie — none of that changed. User accounts are
  Postgres (Neon, via Prisma — `prisma/schema.prisma`), because uniqueness and
  relations (one user, many linked OAuth accounts) are exactly what a KV blob
  store can't enforce on its own.
- Auth is Auth.js v5. Middleware runs on the Edge Runtime and only checks for a
  valid session JWT (`app/lib/auth.config.ts`) — it never loads bcrypt or the
  Prisma adapter, both of which are Node-only and live in the separate full
  config (`app/lib/auth.ts`) that routes and pages use instead.
- Runtime dependencies are deliberately few: next, react, react-dom, leaflet
  (the map), Vercel analytics, and now next-auth/@auth/prisma-adapter/prisma/
  bcryptjs for accounts — the same "justified exception, not a small add" bar
  as leaflet.
- Rate limiting is per-process, so on serverless it is approximate. The hard
  spend guarantee has to be a billing cap at the provider.
- **Signing up is optional, never a wall.** The intake, `/start`, and `/plan`
  work exactly as before with zero account interaction. Middleware protects
  only `/onboarding`. An in-progress intake is adopted into the account at
  signup rather than lost, but nothing requires an account to plan a route.

**Explicitly undecided**

- **Settings management.** Profile edit, password change, two-factor auth,
  notification preferences, and data export/deletion are designed (see the
  Account & Settings PRD) but not built. A named next milestone.
- **Password reset.** Not built. `/login` deliberately has no "forgot
  password" link rather than one pointing at a page that doesn't exist yet.
- **Pricing and whether the core plan stays free.** "Vocation Plus" exists today
  only as a labelled coming-soon panel that renders skeletons, not blurred real
  figures. Whether it becomes real, and what falls behind it, is open.
- **Out-of-state and graduate tuition.** Out-of-state rates are not modelled;
  graduate steps are priced at undergraduate rates. Both are known
  understatements and are labelled as estimates.

## Brand Commitments

- **The name is Vocation.** The repository and package name
  (`MyMDCPathway` / `mdc-career-pathway`) are origin artifacts and do not
  describe the current product.
- **Origin:** a Miami Dade College hackathon project (SharkByte 2025), built by
  a named three-person team with a public credits page. The origin is real and
  can be stated; it is not a constraint on scope.
- **The AI disclaimer is binding.** Every view that leads to a plan states the
  results are AI-generated estimates and should be confirmed with an advisor.
  This is a standing commitment, not boilerplate to be designed away.
- README.md currently describes the 1.0 MDC-only product and is stale against
  the shipped 2.0 flow.

## Evidence on Hand

Real, in the repository:

- 53 scraped Florida program catalogs (`app/lib/programs/*.ts`,
  `app/lib/fiu-programs.ts`, `app/lib/mdc-programs.ts`), each hand-verified
  against the school's own site.
- 25 named transfer articulation agreements (`app/lib/transferAgreements.ts`),
  each with a real link and a summary written per school.
- 411 pre-generated cached answers in `data/seed-cache.json` (153 pathways, 77
  career suggestion sets, 181 exam records).
- 61 school logos in `public/logos/`, plus originals in `School Logos/`.
- Product screenshots and a demo GIF in `Images/`.
- A team page with three real people, real photos, and real LinkedIn/GitHub
  links (`app/team/page.tsx`).
- Live BLS wage data and Wikipedia/Commons imagery, fetched at request time.

**Absent, and not to be fabricated:** no testimonials, no named customers or
institutional partners, no usage or outcome data, no press, no accuracy
benchmark, no pricing. There is no evidence any student has acted on a plan and
none should be implied.

## Product Principles

1. **Never invent school data.** A program, link, contact, or cost either comes
   from a verified source or does not ship. A missing entry is acceptable; a
   wrong one is not. People act on this.
2. **Say it is AI-generated, every time.** Anywhere a plan or a cost appears,
   the estimate is labelled and the advisor check is named.
3. **Constrain where there is real data; verify where there is not; state which
   one you are in.** A weaker plan with an honest confidence level beats a
   refusal, and beats a confident fabrication by more.
4. **Prefer nothing over something wrong.** No link beats a wrong link. A dead
   resource is dropped and counted, not silently substituted.
5. **The route leads, not the institution.** Classify how a career is actually
   entered before showing anyone a school. A degree ladder offered to someone
   who needs an apprenticeship costs them years.

## Accessibility & Inclusion

No product-specific standard has been established beyond what the code already
enforces: school brand colors are contrast-corrected until white text clears
WCAG AA, asserted by test across all 61 schools. Treat AA contrast as the
existing floor; anything further is an open decision.
