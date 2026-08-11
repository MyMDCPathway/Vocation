# Vocation

Vocation is an AI-powered planning tool that shows students the whole road ahead — from the program they start with all the way to the career they're aiming for.

Picking a major is hard when you can't see where it leads. Most students never get a clear, end-to-end picture of how programs, transfers, licensing exams, and advanced degrees actually fit together. Vocation fills that gap: you type in a career, and it lays out a complete, step-by-step path, with real programs, transfer options, internships, and certification exams you'll need along the way.

> **Independent project.** Vocation is not affiliated with, endorsed by, or sponsored by Miami Dade College or any other educational institution. Program and transfer data comes from institutions' own public catalogs and from federal datasets; their inclusion doesn't imply a partnership.

![Vocation home page](Images/Vocation%20Main.png)

![Vocation demo](Images/VocationPresentation-ezgif.com-optimize.gif)

## What it does

- **Career-to-pathway planning.** Enter a career like "Architect" or "Mechanical Engineer" and get a full academic pathway generated for you.
- **Real school data.** 53 Florida institutions carry a scraped program catalog; any other school in the world can be planned against via a verified lookup. Institution-level outcome figures come from the US Department of Education's College Scorecard.
- **Real wage data.** Career overviews show wage percentiles and employment counts from the Bureau of Labor Statistics survey, for the student's own metro area where available — clearly separated from anything the model estimated.
- **Transfer planning.** Recommended bachelor's and graduate options, partner universities, and articulation details, with links to dig deeper.
- **Licensing and certifications.** Pathways call out the exams a career actually requires (FE and PE for engineers, NCLEX for nurses, the A.R.E. for architects), with links to official sources.
- **Cost and financial aid estimates.** Tuition-and-fees ranges priced per school, plus a Pell Grant estimate computed entirely in the browser.
- **Accounts.** Save pathways, annotate them, export all your data, or delete your account outright.
- **"What fits me" quiz.** Answer a short set of questions and get career suggestions matched to your responses.

## Getting started

### Prerequisites

- Node.js 18.17 or newer (Next.js 14 requires it)
- A Google Gemini API key — free at [Google AI Studio](https://aistudio.google.com/app/apikey)
- A PostgreSQL database — any will do; the project is developed against [Neon](https://neon.tech)

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/Vocation.git
cd Vocation
npm install
```

### 2. Configure the environment

```bash
cp .env.example .env.local
```

`.env.example` documents every variable with notes on which are required. The three that matter to get running:

```bash
GEMINI_API_KEY=your_key_here     # every AI feature routes through this
DATABASE_URL=postgres://...      # accounts, saved pathways
AUTH_SECRET=                     # generate with: npx auth secret
```

`.env.local` is gitignored, so keys never get committed.

Everything else is optional and degrades cleanly when absent — the app is built so that a missing integration disables a feature rather than breaking a request:

| Variable | What it adds when set |
| --- | --- |
| `BLS_API_KEY` | Raises the BLS wage-data quota from 25 to 500 requests/day |
| `SCORECARD_API_KEY` | Lets `npm run fetch:scorecard` refresh the College Scorecard snapshot |
| `KV_REST_API_URL` / `_TOKEN` | Durable pathway cache, so a generation is billed at most once ever |
| `RESEND_API_KEY` / `EMAIL_FROM` | Password-reset emails (falls back to console logging) |
| `SENTRY_DSN` and friends | Error monitoring |

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Run it

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### 5. Optional: pre-generate the common careers

```bash
# terminal 1 — dev server with seeding enabled
SEED_MODE=1 npm run dev          # PowerShell: $env:SEED_MODE=1; npm run dev

# terminal 2
npm run seed
```

This walks the canonical career list, generates each pathway once, and writes the results to `data/seed-cache.json`. Those results are committed and served instantly afterward, so visitors never wait on a generation and the API key is never charged for a career already covered. Re-running skips whatever's already in the file, so an interrupted run can just be restarted.

### A note on rate limits and cost

The app uses Gemini's Flash model (`gemini-flash-latest` by default). On the free tier Google caps requests per minute, and an uncached search makes several calls.

Four things keep that under control:

- **The seed file** (`data/seed-cache.json`) answers common careers with no API call at all.
- **An in-memory cache** covers repeats within a running server.
- **A durable KV layer** (`app/lib/durableCache.ts`) survives cold starts, so a pathway is generated at most once ever.
- **Rate limiting** (`app/lib/rateLimit.ts`) caps requests per IP and enforces a daily ceiling, configurable in `app/api/rate-limit-config.ts`. Cached and seeded answers don't count against either limit.

If you deploy this publicly, set a billing budget cap in Google Cloud — that's the only hard guarantee against a surprise bill.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build (runs `prisma generate` and migrations first) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run the linter |
| `npm test` | Run the test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run seed` | Pre-generate pathways into `data/seed-cache.json` |
| `npm run export-cache` | Pull real-traffic generations into the seed file |
| `npm run fetch:scorecard` | Refresh the College Scorecard snapshot |
| `npm run scrape:*` | Re-scrape a specific university's program catalog |

## How it's built

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, with a design-token system in `app/globals.css` |
| Database | PostgreSQL via Prisma (developed against Neon) |
| Auth | Auth.js v5 (`next-auth`), credentials + bcrypt |
| AI | Google Gemini |
| Data | Bureau of Labor Statistics, College Scorecard, O*NET, scraped catalogs |
| Email | Resend |
| Monitoring | Sentry |
| Maps | Leaflet |
| Tests | Vitest — 1,256 tests across 67 files |

Gemini calls are handled server-side in `app/api` so the key is never exposed to the browser.

For a detailed walkthrough of the engineering decisions — caching architecture, the AI-honesty rules, security, and accessibility — see **[ENGINEERING.md](ENGINEERING.md)**.

Two pieces worth calling out here because they're what keeps the app fast and cheap:

- **`app/lib/careerCanonical.ts`** resolves free text to one canonical title, so "nurse", "RN", "nursing", and "I want to be a nurse" share a single generated pathway instead of producing four. The synonym table (`careerAliases.ts`) is deliberately conservative — careers only collapse when they genuinely share a degree and licensing route.
- **`app/lib/apiCache.ts`** layers a committed seed file over an in-memory cache, with `durableCache.ts` behind both. The seed layer matters on serverless hosts, where handlers run in short-lived processes with a read-only filesystem and the in-memory layer is wiped on every cold start.

## Testing

```bash
npm test
```

1,256 tests across 67 files, requiring no secrets and no database — the CI workflow runs them on every push. Coverage is deliberately weighted toward the things that are expensive to get wrong: rate limiting, cache-key isolation, the career-legitimacy policy, URL validation, database error handling, and a stylesheet-reading suite that guards against entrance animations silently turning into a blank page.

## Project status

Vocation started as a Miami Dade College hackathon project and grew well past it. Pathway generation, comparison, cost and aid estimates, real BLS wage data, school search, accounts, and the quiz all work today.

## Disclaimer

Pathways and cost figures are AI-generated estimates and can contain inaccuracies. Wage and outcome figures describe past students and workers and are not a prediction of anyone's earnings. Always confirm details with an academic advisor before making decisions.
