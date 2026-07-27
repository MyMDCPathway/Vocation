# Vocation — Project Handoff

Everything a new developer needs to work on this codebase safely. Written
2026-07-25, last updated **2026-07-27** against commit `3290c18` on `main`.

Read the **Rules** section before writing code. Several of them exist because
the obvious approach has already failed here in a way that wasn't visible until
production.

> **Next session: private universities, batch 7 of 21.**
> All **12 SUS public universities are done**, and six private (SACSCOC)
> schools are wired up: **University of Miami**, **Stetson University**,
> **Embry-Riddle Aeronautical University** (Daytona Beach campus),
> **University of Tampa**, **Barry University**, and **Lynn University**.
> Stetson's, ERAU's, UT's, Barry's, and Lynn's generations were all verified
> fully live end-to-end — a real Gemini call through a locally-running dev
> server, with `GEMINI_API_KEY` set — and every returned step name matched
> the scraped catalog exactly, with every program link resolving to its real
> page. UM's verification stopped short of that (no API key was available in
> that session); if you want that gap closed, re-run one live UM generation
> now that a key exists.
>
> **UM** is the best-case catalog shape found in this whole project:
> `bulletin.miami.edu` (CourseLeaf, no WAF) has a single Program Index page
> listing all 689 rows in one plain `fetch()`, each with a real per-program
> link, level, and Plan column. The round-trip test caught 5 real mismatches
> (per §13's standing warning that this happens on every university, no
> exceptions): three were missing `GRADUATE_HINT` codes (`md`, `mps`, `msf`),
> one was a truncated title on UM's own site, and one was a certificate
> mistagged `Plan="Major"`. A separate bug — two rows linking to an external
> domain that the scraper blindly prepended its own origin to — was only
> caught by bulk-checking all 483 scraped URLs return HTTP 200, not by the
> round-trip test. **Bulk URL verification is worth doing for every school.**
>
> **Stetson** was a harder scrape than UM, closer to the SUS batch's
> difficulty: no single listing page exists at any level. Undergrad (3 real
> degree-granting colleges of the 6 nav sections — WORLD/Discovery/Honors are
> programs, not degree-granting colleges) uses a tabbed "Majors" UI with
> heading-grouped `<li>` lists; graduate (2 of those 3 colleges) is loose
> prose with a heading per program area and a real link inside the following
> paragraph — one heading turned out to be an umbrella covering 4 genuinely
> distinct sub-programs, each with its own link and fully-descriptive anchor
> text, so a heading-only extraction would have silently collapsed all 4 into
> one wrong entry (see the scraper's own header comment in
> `scripts/scrape-stetson-programs.mjs` for the exact "longer text wins /
> 2+ links means trust the links" rule that handles both shapes). Law (11
> real programs) has no listing page either — hand-identified from `/law/`'s
> own nav, confirmed via each page's own `<title>`. Zero round-trip mismatches
> on the first pass — the "spell the credential out in parens" naming choice
> (`"American Studies (Bachelor of Arts)"`) already matches existing
> `BACHELOR_HINT`/`GRADUATE_HINT` patterns with no new codes needed.
>
> **ERAU** (Daytona Beach campus — floridaSchools.ts's id, since ERAU runs
> separate catalogs per campus) was the cleanest scrape of the four: one
> page, one `fetch()`, heading-per-level (Associates/Bachelors/Masters/
> Combined Program Pathways/Dual Masters/Certificates/Doctoral/Ph.D.
> Programs), and every entry's own anchor text already states its complete
> credential — no name synthesis needed at all, unlike Stetson. Associates
> and Certificates were excluded (the same call UCF's scraper made for its
> own associate track: this app's university template starts at the
> bachelor's, so a level below that isn't a fit for the shape). "Combined
> Program Pathways" (90 entries) and "Dual Masters" (14) looked at first like
> they might be noise but are real, individually-linked accelerated/dual-
> degree tracks — ERAU's Business and Aviation programs each pair with
> several specific graduate programs. Zero round-trip mismatches on the first
> pass, same as Stetson.
>
> **UT** was the first school on **SmartCatalogIQ**, a third catalog
> platform after CourseLeaf and Acalog — no WAF, but (unlike UM/ERAU) no
> single flat program-index page either. Undergrad came from the site's own
> `/site-map` page (a complete, clean, nested link tree with real display
> text on every link — worth checking for on any future school before
> assuming page-by-page crawling is needed) filtered to links under one of
> UT's 4 undergraduate colleges whose own text contains "Major" or starts
> with "Bachelor of"; that college-path restriction is what excludes the
> sitemap's real false positives ("Double Majors", "Declaring/Changing Your
> Advisor or Major" — both policy pages that also happen to contain the word
> "major"). Graduate came from a separate, hand-curated "Graduate Degree
> Programs" page, heading-grouped by college like UM/ERAU with no name
> synthesis needed. One round-trip mismatch on the first pass, the same
> combo-degree shape UM hit: a "Bachelor of Science in Health Science/3+2
> Master of Science in Athletic Training" accelerated track was stored as
> `bachelor` but its own name contains "Master," so `GRADUATE_HINT` read it
> as graduate first — fixed by classifying any undergrad entry whose name
> also names a graduate credential as graduate, matching how the app's own
> matcher reads it (see `scripts/scrape-tampa-programs.mjs`).
>
> **Barry** was the second school on SmartCatalogIQ, and confirmed a real
> platform-discovery trick: `barry.smartcatalogiq.com` returns 200 directly
> (unlike UT's redirect-based subdomain), and — unlike UT — Barry has a
> dedicated, purpose-built "Programs of Study" page per catalog level
> (`id="sc-program-links"`, a SmartCatalogIQ built-in widget) listing every
> program on one page, so UT's sitemap-filtering trick wasn't even needed.
> **Check for this exact page shape on every future SmartCatalogIQ school
> before falling back to UT's sitemap approach.** Both pages mix real
> programs with policy pages, bare specialization/concentration tracks with
> no credential of their own ("Biochemistry Specialization"), and
> certificates — filtering on "does the title contain a real credential
> token" (B.A./B.S./B.F.A./... for undergrad, Master/Doctor.../Ph.D./M.S./...
> for graduate) cleanly separates real standalone programs from all three.
> One regex gap found and fixed: `\bdoctor\b` doesn't match inside
> "Doctorate" (the word boundary fails at the "-ate" suffix), which silently
> excluded "School of Law Juris Doctorate Program" until changed to
> `doctor\w*`. A few undergrad entries were the same UM/UT combo-degree
> shape (e.g. "Kinesiology and Sport Sciences (B.S. KHPUS to M.S. KHPS SEPPG
> Seamless)") and got the same fix: reclassify as graduate when the name
> also contains a graduate credential. Zero round-trip mismatches after that
> fix.
>
> **Lynn** was the first school in this batch with no catalog platform
> vendor at all — a bespoke site (`lynn.edu/academics/catalog`) behind
> **Cloudflare bot protection**, a different blocking mechanism than the AWS
> WAF Bot Control seen on the Acalog schools but the same practical effect:
> every plain `fetch()`/`curl` request to the *entire domain* (even the bare
> homepage) returns HTTP 403 "Attention Required! | Cloudflare", while a
> real browser's top-level navigation gets through cleanly — so this is a
> **hand-verified file with no committed scraper**, the same category as
> `flpoly.ts`/`usf.ts`. The real find: Lynn's catalog has no flat
> program-index page anywhere, but **every catalog page shares one
> server-rendered left-nav menu that itself lists all 93 raw entries in the
> entire catalog** (undergrad day / online / graduate divisions × 6
> colleges) as real links, each with its own credential shown in a nested
> `<span>` — so the full catalog came from reading that one shared menu on a
> single page load, not from crawling per-college pages the way Stetson's
> and Lynn's own division/college hierarchy would otherwise have required.
> **Check any bespoke-site school for a shared nav/sitemap component before
> assuming a per-page crawl is needed** — this is the third time in this
> batch alone (after UT's `/site-map` and Barry's `programs-of-study`
> widget) that the real shortcut was a site-wide list hiding in plain sight
> rather than the obvious per-page path. A real extraction bug surfaced and
> got fixed: naively removing the credential span's text from the anchor's
> full `textContent` via `.replace()` corrupted names whose full text
> *starts* with the credential and repeats it in the span (e.g. "Master of
> Science in Psychology" + span "Master of Science" → replace matched the
> leading occurrence, not the trailing duplicate, producing "in
> PsychologyMaster of Science") — fixed by cloning the anchor, removing the
> span node, then reading the clone's `textContent`. Associate-level (7) and
> the one certificate entry were excluded (same call as UCF/ERAU/Barry).
> Zero round-trip mismatches. **Verified with a real live Gemini
> generation**: `/pathway?career=Marketing Manager` under the `lynn` cookie
> returned two pathways whose every degree-step name matched the catalog
> verbatim (`"Marketing (Bachelor of Science)"`, `"Master of Business
> Administration in Marketing"`, `"Advertising and Public Relations
> (Bachelor of Arts)"`), each resolving to its real `lynn.edu` page
> (confirmed by browser navigation, since `curl`-based bulk URL checking
> doesn't work on this domain either).
>
> **Next up: the other 15 private (SACSCOC) schools.** Don't assume any of
> them repeat these six shapes — §13's "private universities are next"
> section already warned to expect flat-rate tuition (not resident/
> non-resident), wildly different catalog sizes, and a per-vendor platform
> survey each time. Already surveyed and set aside:
> - **Rollins College, Flagler College, Florida Tech, Palm Beach Atlantic,
>   and Saint Leo are all WAF-blocked**, the same way FAMU/FlPoly/USF were
>   — their catalog sites (`catalog.rollins.edu`, `catalog.flagler.edu`,
>   `catalog.fit.edu`, `catalog.pba.edu`, `academiccatalog.saintleo.edu`, the
>   last one Acalog too despite the different subdomain naming) return HTTP
>   202 with `x-amzn-waf-action: challenge` on the actual `content.php`
>   program pages, while the front page/index loads fine. Per §13's
>   browser-navigation technique, a real browser can likely still get
>   through by top-level navigation; that hasn't been tried yet for any of
>   the five.
> - **Ave Maria University's catalog has no real per-program or per-
>   department URL at all** — it's a client-rendered single-page app
>   (`catalog.avemaria.edu/programs`) where every one of its 81 real,
>   cleanly-categorized programs (36 majors, 38 minors, 7 graduate) expands
>   inline via local component state rather than navigating anywhere; the
>   URL never changes no matter what's clicked, confirmed by watching
>   `location.href` after clicking both a program card and its expand
>   control. If this school gets picked up, the FSU precedent applies: real
>   names, one shared link (`https://catalog.avemaria.edu/programs`) rather
>   than a fabricated per-program URL.
> - **Bethune-Cookman's Acalog gateway (`catalog.cookman.edu`) is not
>   WAF-blocked** (`index.php?catoid=41` returns a plain 200) but its catalog
>   navigation tree loads by some other, not-yet-found mechanism (no
>   `content.php`/`navoid` links present in the static HTML) — worth another
>   look before assuming it needs the same browser-navigation workaround as
>   the blocked schools.
> - **St. Thomas University's catalog is PDF-only** (`stu.edu/academics/
>   course-catalogs/`, e.g. "Final-UG-Catalog-2025-2026-...pdf") — no HTML
>   catalog exists at all, so this needs a different extraction approach
>   (PDF text extraction) than every other school so far, or hand entry.
>   **Florida Memorial University's catalog is PDF-only too**
>   (`fmu.edu/academics/catalogs-courses/`) — same obstacle, same open
>   question.
> - **Eckerd College has real per-major pages but none of them state a
>   credential.** `eckerd.edu/academics/majors/` lists ~41 real majors with
>   real per-major links (e.g. `eckerd.edu/biology/`), but neither that page
>   nor the individual major pages nor the general academics pages mention
>   "Bachelor" anywhere — confirmed by a text search across several pages.
>   Eckerd's own PDF catalog almost certainly states the credential per
>   major, but per-major HTML pages don't, and guessing whether a given
>   major is B.A. or B.S. would violate "never invent school data." Needs
>   either PDF extraction or a source that states credentials that hasn't
>   been found yet.
> - `catalog.nova.edu` is a **CourseLeaf placeholder ("Coming Soon")** —
>   not usable yet regardless of NSU's own separate warning about its likely
>   NSU-scale catalog size.
> - `<school>.smartcatalogiq.com` **exists but returns "Layout Not Found" or
>   404 on every path tried** for Florida Southern, Keiser, and Edward
>   Waters — these subdomains are reserved on SmartCatalogIQ's platform but
>   have no content actually deployed (confirmed distinct from Barry's and
>   UT's working instances, both of which serve real content immediately).
>   Each needs its real current catalog URL found via that school's own
>   registrar/academics page (the way Barry's, Saint Leo's, Eckerd's, and
>   Lynn's were all found — none of them were at the subdomain first
>   guessed) rather than another subdomain guess. **Jacksonville University
>   has no `catalog.*`/`bulletin.*`/`*.smartcatalogiq.com` subdomain at
>   all** (403 from CloudFront/S3 on the SmartCatalogIQ guess) — needs a
>   full fresh platform survey. Note also that a bare
>   `catalog.<abbreviation>.edu` guess can hit an entirely unrelated school
>   by coincidence — `catalog.ewu.edu` resolved to Eastern Washington
>   University, not Edward Waters University, despite both using "EWU" as a
>   short name.

---

## TL;DR for AI

Read this before touching anything. It is the minimum context to not break the
app. Full detail for every line below is in the numbered sections.

**What it is:** Career → AI-generated educational pathway (which degree, which
school, which exams), for one of several Florida schools. Next.js 14 App
Router, TypeScript, no database.

**The one rule everything else follows from:** Gemini prompts are grounded in
scraped real program catalogs (`app/lib/programs/*.ts`, `app/lib/fiu-programs.ts`,
`app/lib/mdc-programs.ts` — 5,173 real programs across 38 files). Never let the
model free-generate a program name — it invents plausible-sounding degrees that
don't exist. If you add a school, you scrape its catalog first (§2, §7).

**45 of 61 schools can generate pathways** — all 27 state colleges, all 12
SUS public universities (FIU + UCF + UF + FGCU + UWF + NCF + UNF + FlPoly +
USF + FAU + FAMU + FSU), and six private universities (UM, Stetson, ERAU,
UT, Barry, Lynn). The other 15 — all private (SACSCOC) — are gated off and
show a "we don't have this catalog yet" notice. That's the next body of
work (§13).

**There is no traditional database.** Persistence is `data/seed-cache.json` (a
committed JSON file, §5), an optional Redis/KV durable layer (§5.1), and a
`vocation_school` cookie. Don't go looking for Prisma/Supabase/a schema.

**Selected school lives in a cookie, not localStorage, and this is load-bearing
(§6).** The server renders the school-specific logo/colors/catalog from that
cookie before React runs. If you "simplify" this back to
`localStorage` + `useEffect`, the MDC logo will flash on every page load again
— this exact regression already happened once. Read §6 before touching
`SchoolProvider.tsx`, `useSelectedSchool.ts`, or `layout.tsx`.

**Request pipeline order is load-bearing (§2):** canonicalize career → cache
lookup → rate limit → build prompt → call Gemini. Rate limiting must stay
*after* the cache check, or browsing pre-generated content gets throttled.

**Generated files, never hand-edit:** everything in `app/lib/programs/` and
`app/lib/fiu-programs.ts` says GENERATED at the top. Only two have committed
scrapers (`npm run scrape:fiu` / `scrape:broward`); the other 25 were scraped
with throwaway browser-driven scripts (§9) — treat those files as the source of
record and re-scrape by hand if a catalog goes stale.

**Two school ids don't match their catalog filenames.** `dsc.ts` is school id
`daytona`; `ssc.ts` is school id `seminole`. Registries key on the
`floridaSchools.ts` id, never the filename. Getting this wrong produces a
silently unreachable catalog.

**Before you "fix" an inconsistency, check §7.** MDC's catalog/prompt/URL
scheme is deliberately different from every other school's. That's a documented
decision, not debt — don't unify it without reading why.

**Known-dead code:** `app/page.tsx` still contains a full pathway-generation
code path (`handleGeneratePathway`, `callAPI`, a hidden
`#pathway-display` div) that nothing renders, and it does not send `school` to
the API. Don't build on it; either delete it or wire it up properly (§8, §9).

**Before claiming something is fixed, verify it in an actual running browser.**
Typecheck-clean and test-clean is not proof — the retired-Gemini-model bug and
the logo-flash bug both passed every automated check while still being broken.

**Golden commands:**
```bash
npm test          # 434 tests; 433 pass, 1 known pre-existing failure (§8)
npm run build     # must compile; NEVER run this while `npm run dev` is up (§8)
```

---

## 1. What this app is

Vocation takes a career ("Registered Nurse") and generates a complete
educational pathway for it — which program to start in at a specific Florida
school, where to transfer, which licensure exams to sit, roughly what it costs.
Pathways are generated by Google Gemini, constrained to real program catalogs so
the model can't invent degrees that don't exist.

It started as a SharkByte 2025 hackathon project for Miami Dade College and has
since grown a multi-school system.

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS ·
Vitest · Google Gemini API. No database — see §5.

---

## 2. Architecture at a glance

```
Browser                          Server (Next.js route handlers)        External
───────────────────────────────  ─────────────────────────────────────  ─────────
/pathway  ──POST career+school──▶ /api/generate-pathway
                                   ├─ resolveCareer()      canonicalize
                                   ├─ apiCache lookup ─────────┐
                                   ├─ rate limits              │ (hit → return)
                                   ├─ buildPathwayRequest()    │
                                   └─ fetch ───────────────────┼──────▶ Gemini
                                                               │
                                  data/seed-cache.json ────────┘
```

Four things happen on every generation request, in this order. The order
matters and is load-bearing:

1. **Canonicalize** the career (`careerCanonical.ts`) — "RN", "nurse", and
   "I want to be a nurse" all become `Registered Nurse`.
2. **Cache lookup** (`apiCache.ts`) — keyed on `pathway:<school>:<career>`.
   A hit returns immediately, costs nothing, and is not rate limited.
3. **Rate limits** (`rateLimit.ts`) — only reached on a cache miss, so browsing
   pre-generated content is never throttled.
4. **Build the prompt** (`pathwayPrompts.ts`) — per-school, grounded in that
   school's real catalog.

### The core insight of the whole codebase

**Constraining the model's output space beats instructing it to be careful.**
Early versions asked Gemini for pathways and it confidently returned degree
programs that MDC does not offer. Telling it "be accurate" did not fix it.
Embedding the actual list of real programs in the prompt and requiring it to
choose from that list did. Every school's prompt does this, and it is why the
scrapers exist at all.

---

## 3. Folder structure

```
app/
  layout.tsx                  Root layout. Reads the school COOKIE (server-side)
                              and renders the palette + provider. See §6.
  page.tsx                    Home page: hero, school selector, footer.
                              ⚠ Contains a large block of DEAD pathway code (§9).
  pathway/page.tsx            THE MAIN PAGE. Search, generation, flowchart,
                              comparison, cost breakdown, popups. 1604 lines.
  career-discovery/page.tsx   "What fits me" quiz → /api/career-assessment.
  privacy/, terms/            Static legal pages.
  globals.css                 Tailwind + flowchart CSS + palette defaults.

  api/
    generate-pathway/         Main generator. School-aware. Cached + limited.
    get-career-suggestions/   Career list shown before you pick. Cached.
    get-exam-info/            Licensure-exam details. Cached.
    career-assessment/        Quiz results. NOT cached (answers are unique).
    rate-limit-config.ts      Tunable limits. Edit here, not in rateLimit.ts.

  components/
    SchoolProvider.tsx        Context carrying the server-known school id.
    SchoolSelector.tsx        The dropdown (home page only).
    SchoolHeader.tsx          Logo header for non-home pages.
    SchoolMark.tsx            Logo-or-monogram, shared by both of the above.
    ProgramLink.tsx           Resolves a degree step → school program page.
    ExamStep.tsx              Exam step rendering + requirements popup.

  lib/
    ── school identity ──
    floridaSchools.ts         All 61 accredited FL schools. Names, colors, logos.
    schoolStorage.ts          Cookie + localStorage keys and helpers.
    useSelectedSchool.ts      Hook reading the school from context.
    schoolInfo.ts             Per-school footer links, contacts, accessibility.
    schoolTheme.ts            Brand color → 10-step WCAG-safe palette.
    schoolCatalogs.ts         Which schools can generate pathways.

    ── program catalogs ──
    programCatalog.ts         SHARED matcher factory. One implementation.
    programCatalogs.ts        Registry: school id → catalog. 28 entries.
    programs/*.ts             GENERATED. 27 files, 2,979 programs total.
                              ⚠ dsc.ts = id "daytona", ssc.ts = id "seminole".
    fiu-programs.ts           GENERATED. 287 FIU programs.
    mdc-programs.ts           MDC catalog. Hand-written, slug-based (§7).
    transferAgreements.ts     25 flagship articulation agreements (§7).

    ── generation ──
    pathwayPrompts.ts         Per-school prompt construction.
    careerCanonical.ts        Free text → canonical career title.
    careerAliases.ts          Hand-maintained synonym table. 77 careers.
    apiCache.ts               Layers 1+2 (committed seed file + memory).
    durableCache.ts           Layer 3 (Redis/KV). No-ops when unconfigured (§5.1).
    rateLimit.ts              Per-IP + daily ceiling.
    geminiModel.ts            Single source of truth for the model name.
    missLog.ts                Logs what reached Gemini, for growing the seed.

    ── display data ──
    cost.ts, certifications.ts, universities.ts, types.ts, icons.tsx

scripts/
  seed-pathways.mjs           Pre-generates pathways/suggestions/exams (costs $).
  export-cache.mjs            Pulls user-generated pathways from Redis into the
                              seed file. Costs nothing — preferred over seeding.
  scrape-fiu-programs.mjs     Regenerates fiu-programs.ts.
  scrape-broward-programs.mjs Regenerates programs/broward.ts.

data/seed-cache.json          891KB of pre-generated answers. Committed.
public/logos/                 61 logos, all 240×80 transparent PNG.
School Logos/                 7.7MB of ORIGINAL source images. Committed (§9).
```

---

## 4. Key files, in the order you should read them

| Read | Why |
|---|---|
| `app/pathway/page.tsx` | The actual product. Everything else supports it. |
| `app/api/generate-pathway/route.ts` | Only 146 lines; shows the whole request pipeline. |
| `app/lib/pathwayPrompts.ts` | Where the AI behavior actually lives. |
| `app/lib/apiCache.ts` | Explains why the app is fast and cheap. |
| `app/lib/programCatalog.ts` | The matching rules every school shares. |

---

## 5. "Database schema" — there is no relational database

This is worth stating plainly because it's the most likely thing for a new
developer to assume wrongly. **There is no ORM, no migrations, no Prisma, no
Supabase, no SQL.** Persistence is three cache layers plus a cookie.

### `data/seed-cache.json` — 411 keys, 891 KB, committed to git

A flat key/value JSON file. Keys use the format produced by `cacheKey()`:

| Key format | Count | Contents |
|---|---|---|
| `pathway:<school>:<career>` | 153 | Full `PathwayData` object |
| `suggestions:<career>` | 77 | Array of career suggestion objects |
| `exam:<exam name>` | 181 | `{ url, requirements[] }` |

Currently seeded: **77 MDC pathways, 76 Broward pathways.** The other 26
catalogued schools have **zero** seeded pathways — every request for them is a
live Gemini call. See §5.1 for why that's now acceptable rather than urgent.

Values match the TypeScript types in `app/lib/types.ts`:

```ts
PathwayData   { title, pathways: PathwayOption[] }
PathwayOption { title, isPrimary, steps: PathwayStep[] }
PathwayStep   { type: "degree"|"transfer"|"internship"|"exam",
                level, name, description }
```

### Why a committed file rather than a database

Three reasons, and they still hold:

1. **Serverless kills in-memory caches.** Route handlers run in short-lived
   processes with a read-only filesystem. Anything not in the repo is gone on
   the next cold start. A committed file survives deploys.
2. **It's reviewable.** Pathways are advice students may act on. A file can be
   read, corrected, and diffed in a pull request. A row in a hosted database
   can't be reviewed as easily.
3. **The data is finite and read-mostly.** There are only so many careers.

### 5.1 Layer 3 — the durable cache (`durableCache.ts`)

Added 2026-07-26. Solves the "long tail" problem §5 used to defer.

Layer 2 (in-memory) dies on every serverless cold start, so a pathway a student
already paid a Gemini call for got re-billed minutes later. Layer 3 is a
Redis/KV store that sits **behind** layers 1–2 and survives cold starts.

```
seed file (free, permanent)  →  memory (free, dies on cold start)
                             →  Redis (survives)  →  Gemini (costs money)
```

Two payoffs:

1. **A pathway is generated at most once, ever.** Verified: after a cold start,
   a previously generated pathway served in 633 ms with no Gemini call.
2. **`npm run export-cache` grows the seed file for free** — it pulls what real
   users generated into `data/seed-cache.json` with **zero** Gemini spend,
   because the generation already happened when a student asked for it.

**The intended workflow, and why it beats bulk seeding.** Seeding all 77 careers
× 27 unseeded schools is ~2,079 Gemini calls and ~8.7 hours serial. Instead:

```bash
# students use the site; misses generate once and persist
npm run export-cache            # pull them into the seed file, $0
git diff data/seed-cache.json   # REVIEW — see below
```

**Review is doing real work, not ceremony.** Exported entries went straight from
Gemini to a student with no human check. Merging one makes it the permanent
answer. The script refuses to overwrite an already-seeded key for exactly this
reason.

**Design constraints, all deliberate:**
- **Zero npm dependencies.** Vercel provisions `KV_REST_API_URL` /
  `KV_REST_API_TOKEN` for an Upstash-compatible REST endpoint, which is plain
  `fetch`. No client library to pin or chase through a rename.
- **Every function no-ops when unconfigured.** Local dev and CI have no store
  and must behave exactly as before. A cache that can break a request is a
  liability — all failures are logged and swallowed, and degrade to a miss.
- **2 s timeout, 30-day TTL.** The read sits in front of Gemini; if the store
  can't answer fast, generating beats stalling.

Setup: add a Redis store in Vercel (Storage → Marketplace → Upstash; free tier
is ample), then `vercel env pull .env.local` so `export-cache` can reach it.

### The other persisted state

- **The selected school** — a cookie (`vocation_school`), plus a mirrored
  `localStorage` write for migration. The cookie is authoritative; see §6.
- **Nothing else.** No user accounts, no sessions, no PII stored anywhere.

---

## 6. State management

There is no Redux/Zustand/React Query. State is deliberately boring.

### Selected school — the only global state

This is the one piece worth understanding in detail, because it was rebuilt
three times and the final design is not obvious.

```
Request ──cookie: vocation_school=broward──▶ layout.tsx (SERVER)
                                              │ reads cookie
                                              │ renders <html data-school>
                                              │ renders <style> palette
                                              └─▶ <SchoolProvider schoolId>
                                                    └─▶ useSchoolId() (context)
                                                          ├─ SchoolSelector
                                                          ├─ SchoolHeader/Mark
                                                          ├─ footers
                                                          └─ ProgramLink
```

**Why a cookie and not localStorage.** The server renders the HTML. It cannot
read `localStorage`. So the HTML always shipped with MDC's logo in it, and the
browser painted that *before React executed*. No client-side effect can fix
this — not `useEffect`, not `useLayoutEffect` — because the wrong logo is
already on screen by the time any JavaScript runs. A cookie travels with the
request, so the server renders the right school from the start.

Verify it yourself:

```bash
curl -H "Cookie: vocation_school=fiu" localhost:3000 | grep -o '/logos/[a-z]*\.png'
# → /logos/fiu.png     (no JavaScript involved)
```

**Why changing school triggers a full page reload.** Every consumer reads the
school from the server render. The new cookie only reaches the server on the
next request. `window.location.reload()` in `SchoolSelector.choose()` is what
carries it there. It's a real tradeoff (brief white flash) and a same-page
update would need shared client state instead — deliberately not done, because
the server render is what makes the logo correct.

**Cost:** reading a cookie opts the pages into dynamic rendering. Build output
shows `ƒ (Dynamic)` rather than `○ (Static)`. Correct for a personalized page.

### Everything else

Local `useState` inside `pathway/page.tsx` — ~20 pieces of state for the search
box, loading, modals, comparison list, popups. It's a large component but the
state is genuinely page-local. Don't lift it without a reason.

---

## 7. Key decisions and their rationale

**Ground prompts in real catalogs.** §2. The single most important decision.

**Two prompt shapes, not one per school.** A university pathway starts at a
bachelor's with no transfer step; a state college starts at an associate and
transfers out. `pathwayPrompts.ts` has an FIU prompt, a *generic state-college
template* parameterized by catalog, and MDC's original hand-tuned 13,000-char
prompt. Adding a college means a scraper + two registry lines, not a new prompt.

**MDC is deliberately inconsistent with the others.** `mdc-programs.ts` builds
URLs from name slugs; every other school uses scraped name→URL tables. MDC also
keeps its bespoke prompt and is absent from `programCatalogs.ts`. This is not an
oversight — MDC's version works, is well tested, and its 77 pathways are
already seeded. Migrating it would risk the most-used school for consistency's
sake alone. Leave it unless you have a concrete reason.

**Transfer agreements are named, not generic.** `transferAgreements.ts` records
each state college's *flagship* articulation agreement (DirectConnect to UCF,
Link2FAU, FUSE, Aspire, …) and the prompt names it in the transfer step, because
"transfer to a four-year university" is useless advice for the one step a
student actually has to plan.

Three rules the file enforces, each because reality violated the simple version:

- **`summary` is written per school, never templated.** Schools promise
  materially different things. CF/EFSC guarantee UCF admission; FGC's Going
  Gator only routes into one UF college's majors; NFC's is a coaching pathway
  with *no* guarantee at all. One sentence for all of them would misstate the
  weaker ones.
- **A school with no real flagship gets `null`, not a guess.** Chipola holds
  parallel AA sheets to five universities with no branded guarantee, so it has
  no entry and falls back to the generic instruction. A test asserts this.
- **The prompt always states the statewide 2+2 floor** and explicitly says never
  to imply the named partner is the only option — because it isn't.

**Two catalog files are named differently from their school id.** `dsc.ts` →
`daytona`, `ssc.ts` → `seminole`. All three registries key on the
`floridaSchools.ts` id. Keying on the filename yields a catalog nothing can
reach, and nothing fails loudly when you do.

**Strict level matching.** If a query names a credential ("Master of Science
in X"), the catalog returns a program at that level or *nothing*. Linking a
master's step to a bachelor's page is worse than no link. This caps FIU link
coverage at ~37% of post-MDC degree steps, and that's the correct trade.

**`gemini-flash-latest`, not a pinned version.** Google retired
`gemini-2.5-flash` for new API keys mid-project and every AI feature broke with
a 404. The floating alias survives that. Pin via `GEMINI_MODEL` if you need
reproducible output.

**Rate limits apply only after a cache miss.** Browsing seeded content is free
and unlimited. Only genuinely new generations count.

**Contrast-corrected school colors.** `schoolTheme.ts` darkens light brand
colors until white text clears WCAG AA. UCF's gold is 2.4:1 raw — unreadable as
a button. A test asserts this holds for all 61 schools.

---

## 8. Known bugs and gotchas

### Real bugs

**`app/page.tsx` doesn't send the school to the API.** Line ~87 posts
`{ career }` without `school`, so it would silently generate an MDC pathway
regardless of selection. Currently harmless *only because that code path is
dead* (see §9). If you revive the home-page generator, fix this first.

**`career-discovery` is not school-aware.** The quiz posts only `answers`. It
returns careers, not programs, so it's defensible — but if you make quiz
results school-specific, this needs the school too.

**One known failing test: `fiuCoverage.test.ts`.** Asserts >30% of post-MDC
degree steps resolve to an FIU program; actual is 166/651 = 25.5%. It is
**pre-existing and unrelated to the multi-school work** — the ratio has not
moved across any of the last several batches. Either the threshold was set
optimistically or FIU's catalog drifted. Don't "fix" it by lowering the number
without checking which; it's a coverage floor doing its job.

**Rate limiting is per-instance, not global.** Counters live in process memory,
so on serverless the effective limit scales with warm instance count. It stops
casual abuse; it is *not* a hard guarantee. **The real guarantee must be a
billing budget cap in Google Cloud.** Set one.

### Gotchas that will waste your afternoon

**Never run `npm run build` while `npm run dev` is running.** They share
`.next/` and it corrupts the dev server, producing bogus `Cannot find module
'./276.js'` errors that look like real bugs. Fix: stop dev, `rm -rf .next`,
restart.

**Seeded careers silently disable tests that mock Gemini.** If a career is in
the seed file, the route returns early and your mocked `fetch` is never called —
the test passes while testing nothing. Use `_setSeedForTests({})`.

**Bash paths break inside `node -e` strings on Windows.** Git Bash's
`/c/Users/...` isn't rewritten inside a quoted JS string. Convert with
`cygpath -w "$p" | tr '\\' '/'`.

**Generated files are overwritten without warning.** `fiu-programs.ts` and
`programs/broward.ts` say GENERATED at the top. Edit the *scraper*.

---

## 9. Unfinished work

**Dead code in `app/page.tsx`.** `handleGeneratePathway`,
`callAPI`, the comparison logic, and a `<div id="pathway-display" className="hidden">`
are all left over from when the home page generated pathways. `careerInput` is
never bound to a rendered input. Deleting it is safe and would remove the
school-param bug above along with it. Left in place because deleting live-looking
code deserves an explicit decision.

**26 of 28 catalogued schools have no seeded pathways.** Only MDC and Broward.
Every request for the other 26 is a live Gemini call. **Prefer
`npm run export-cache` over `npm run seed`** — see §5.1. Bulk-seeding all of
them is ~2,079 calls and ~8.7 hours; harvesting real demand is free.

**25 of 27 scrapers were throwaway.** Only FIU and Broward have committed
scrapers in `scripts/`. The other 25 catalogs were produced by browser-driven
one-off scripts that no longer exist. The generated files are the source of
record. If a catalog goes stale you re-scrape by hand — budget for that rather
than assuming `npm run scrape:*` covers it.

**No school selector on `/pathway`.** It reads the stored school but you must
go back to the home page to change it. Users landing on a shared `/pathway`
link can't switch.

**`School Logos/` (7.7 MB of originals) is committed.** Working copies in
`public/logos/` are only 1.4 MB. The originals are useful for reprocessing but
bloat the repo; consider moving them out.

**The logo-processing pipeline lives in a scratch directory, not the repo.**
It rasterizes SVGs, flood-fills backgrounds, trims, and pads to 240×80. If you
add logos you'll need to rebuild it. Worth moving into `scripts/`.

**Pre-existing test-suite noise.** `get-career-suggestions` logs raw Gemini
responses to the console on every call. Harmless, noisy.

---

## 10. Rules for future developers

1. **Never invent school data.** If a program, contact, or link isn't verified
   from the school's own site, don't add it. Students act on this. A missing
   entry is fine; a wrong one is not.

2. **Edit scrapers, never generated files.** Regenerate with `npm run
   scrape:fiu` / `scrape:broward`. Both refuse to write a suspiciously small
   catalog rather than committing a broken parse — don't remove those guards.

3. **Look at images before shipping them.** Automated checks pass on logos that
   render invisible (white-on-transparent) — this happened repeatedly. Load the
   page and *look*.

4. **Verify in a browser, not just in tests.** Several bugs here typechecked,
   passed tests, and were still broken in the browser. Both the logo flash and
   the retired Gemini model were only findable by running the thing.

5. **Anything that must be correct on first paint belongs on the server.**
   That means a cookie, not `localStorage`. See §6.

6. **Cache keys must include everything that changes the answer.** Career *and*
   school. Getting this wrong serves one school's pathway to another.

7. **Prefer no link over a wrong link.** Applies to program URLs, contacts,
   transfer agreements. Strictness is the design.

8. **Don't add a dependency for something small.** The app has three runtime
   dependencies (next, react, react-dom). Image tooling was installed in a
   scratch dir specifically to keep `package.json` clean.

9. **When you change one copy of something, grep for the others.** This
   codebase has had duplicated footers, duplicated headers, duplicated matching
   logic, and duplicated state reads — every one of them drifted before being
   found. `grep -rn "mdc.edu" app/` before assuming you got them all.

10. **Keep the disclaimer.** Every pathway view says results are AI-generated
    and should be verified with an advisor. That's not boilerplate.

---

## 11. Running it

```bash
npm install
cp .env.example .env.local     # add GEMINI_API_KEY from aistudio.google.com
npm run dev                    # http://localhost:3000
npm test                       # 434 tests (433 pass, 1 known failure — §8)
npm run build                  # production build
```

**Growing the seed file — prefer this** (free, no dev server needed):

```bash
vercel env pull .env.local     # once, to get KV_REST_API_URL / _TOKEN
npm run export-cache -- --dry-run
npm run export-cache
git diff data/seed-cache.json  # REVIEW before committing (§5.1)
```

**Bulk seeding** (costs money; needs the dev server in another terminal):

```bash
SEED_MODE=1 npm run dev                    # PowerShell: $env:SEED_MODE=1; npm run dev
npm run seed -- --school valencia          # one school, all 77 careers
npm run seed -- --school spc --limit 5     # partial run
```

`SEED_MODE=1` bypasses rate limiting for the seeder. **Never set it on a
deployed server.**

### Cost

Roughly **$0.007 per uncached generation** (~4,800 input + ~970 output tokens,
plus exam lookups). Seeding one school's 77 careers ≈ $0.35; all 27 unseeded
schools ≈ $15 and ~8.7 hours serial at the built-in 5 s pacing.

Measured 2026-07-26: per-school system prompts run 3.7 KB–13.4 KB, and **99.8%
of each is career-invariant** (it's the school's catalog). Context caching looks
like the obvious fix but most schools fall *below* Gemini's minimum cacheable
size, and it would optimize a bill that's already ~$1 — the real constraint is
wall-clock time, not tokens. Confirm current Gemini pricing before relying on
these figures.

---

## 12. Test suite — 434 tests, 20 files

| Area | Files | Notable coverage |
|---|---|---|
| Catalogs | `programCatalogs`, `fiu-programs`, `programs/broward`, `mdc-programs`, `fiuCoverage` | Every program round-trips to itself at the right level; no tracking params; coverage floor |
| Generation | `pathwayPrompts` (177 tests), route tests | Per-school: own catalog embedded, own transfer partner named, no other school's catalog leaked, no un-interpolated `${` |
| Transfers | `transferAgreements` | Every agreement has a real school, a live `.edu` link, and a non-stub summary; Chipola stays `null` |
| Caching | `apiCache`, `durableCache` | Seed layer authoritative; layer 3 no-ops unconfigured and degrades to a miss on every failure |
| Limits | `rateLimit` | Per-IP window, daily ceiling, header parsing |
| Theming | `schoolTheme` | **WCAG AA for all 61 schools** |
| Schools | `floridaSchools`, `schoolInfo` | 29 FCS + 12 SUS + 21 private counts, all logos local |

The most valuable tests are the invariants, and each caught a real bug that
typechecked cleanly:

- **`programCatalogs` round-trip** found that certificate abbreviations
  (`C.C.C.`, `T.C.`, `A.T.C.`, PSAV…) weren't recognized, so ~470 certificate
  steps silently resolved to a same-named *associate degree*. Also found FIU
  master's codes (`MAT`, `MPH`, `MSN`, `JD`…) resolving to the *bachelor's*.
- **The WCAG check** caught unreadable button text across the school palette.
- **"no `${` in prompts"** caught template literals shipped un-interpolated.

Write invariants, not examples. "Every program resolves to itself" caught three
real bugs; a test asserting one specific program would have caught none.

---

## 13. Next up — private universities (6 of 21 done)

**Status as of 2026-07-27:** all 27 Florida College System schools AND all 12
SUS public universities are wired up and generating pathways: FIU (original),
UCF (the pilot that validated the university template), UF, FGCU, UWF, NCF,
UNF, FlPoly, USF, FAU, FAMU, and FSU. The private-school batch has started:
University of Miami, Stetson University, Embry-Riddle Aeronautical University
(Daytona Beach), University of Tampa, Barry University, and Lynn University
are all done, using the same `universitySystemPrompt` template unchanged.
What remains:

| Group | Count | Catalogued | Notes |
|---|---|---|---|
| State colleges | 29* | 27 | Done. (*29 includes MDC + Broward) |
| SUS public universities | 12 | 12 (all of them) | Done. |
| Private (SACSCOC) | 21 | 6 (UM, Stetson, ERAU, UT, Barry, Lynn) | **Next: the other 15.** Expect another per-school survey — read "universities are not state colleges" below before assuming these behave like the SUS batch |

Until a school is catalogued it's gated off in `schoolCatalogs.ts` and the UI
shows "we don't have this catalog yet" — so partial progress is safe to ship.

### The university template now exists — UCF is the reference implementation

What used to be FIU's own hard-coded prompt is now a generic
`universitySystemPrompt` / `universityUserQuery` pair in `pathwayPrompts.ts`,
parameterized the same way `collegeSystemPrompt` is for state colleges. FIU was
refactored onto it first (177 pathwayPrompts tests passing unchanged is the
proof the refactor didn't alter FIU's behavior), then UCF was added as the
first genuinely new university.

The dispatcher no longer branches on `schoolId === "fiu"`. It's a registry
lookup instead: `UNIVERSITY_SHORT_NAMES` / `UNIVERSITY_PROGRAMS` (both
`Record<string, ...>` keyed by school id) in `pathwayPrompts.ts`. Adding the
next university is: scrape → `app/lib/programs/<id>.ts` → one line in each of
`schoolCatalogs.ts`, `programCatalogs.ts`, `UNIVERSITY_SHORT_NAMES`, and
`UNIVERSITY_PROGRAMS`. No new prompt-writing needed unless a university turns
out not to fit the "starts at the bachelor's, no transfer" shape.

Per point 2 above, **UCF has no `transferAgreements.ts` entry, and that's
correct, not an oversight** — it's the destination FGC/TSC/Valencia/etc. name
in their own transfer sections, not a school that needs one of its own.

### Twelve different catalog platforms for twelve universities — expect the same for private schools

Point 4 above said to expect bespoke platforms per school. Confirmed, twelve
times over — every single SUS university needed its own survey and its own
scraper shape:

| School | Platform | Scraper approach |
|---|---|---|
| UCF | Kuali Catalog (a JS SPA over a plain JSON REST API) | Hit `https://ucf.kuali.co/api/v1/catalog/programs/<catalogId>?q=` directly (two catalog ids: undergrad + grad). Reconstruct the URL from each program's `pid`. |
| UF | CourseLeaf, two different shapes on two subdomains | `catalog.ufl.edu/UGRD/programs/` is a filterable card grid (undergrad); `gradcatalog.ufl.edu/graduate/programs-college/` is a flat majors-by-college sitemap (grad). Both are plain server-rendered HTML — regex, no browser needed. |
| FGCU | CourseLeaf, single unified page, behind AWS WAF | `catalog.fgcu.edu/programs/` — one A-Z sitemap combining undergrad AND grad, each link already stating its own credential in parens. `fetch()` is blocked (see below); scraper shells out to `curl` instead. |
| UWF | CourseLeaf, two A-Z pages, no WAF | `catalog.uwf.edu/{undergraduate,graduate}/azindex/` — real programs are the entries whose link text ends in "Name, CREDENTIAL"; policy/topic entries on the same page never have that suffix. |
| UNF | Bespoke static site, one giant combined page, no WAF | `unf.edu/catalog/programs/index.html` — a single ~4.7MB page listing all 430 programs across both levels and every college, each with a real link and its own credential code (`ug/`/`gr/` path prefix states the level directly). Simplest of the nine to parse once found. |
| NCF | No real catalog platform at all | See below — this one is genuinely different, not just a different vendor. |
| FlPoly | Acalog, real Program entities, behind AWS WAF that blocks even in-page `fetch()` | Hand-collected via browser navigation, not scraped — see below. |
| USF | Acalog, real Program entities (same shape as the state colleges'), behind AWS WAF | Same hand-collection technique as FlPoly — see below. Two A-Z index pages (`content.php?catoid=25&navoid=4346` undergrad, `catoid=28&navoid=5315` graduate), 428 programs total. |
| FAU | Bespoke single registrar page, no WAF, but hand-authored broken HTML | `www.fau.edu/registrar/university-catalog/catalog/degree-programs/` — one page, one `<h3>` per degree type, each followed by its majors. No per-program page exists; every major links only to its COLLEGE's catalog page, which is the "school of interest" link this scraper stores. See below — this is a real committed scraper (`scrape:fau`), unlike FlPoly/USF, but the parser has to route around inconsistent markup (see below). |
| FAMU | Bespoke, split across two sites by level, no WAF on either | Undergrad: `www.famu.edu/academics/undergraduate-academics/index.php`, one plain-text major list per college (no per-major links, so every major gets its college's link — same shape as FAU). Grad: `graduateschool.famu.edu/graduate-programs/graduate-programs-<slug>.php`, one page per college (11 total), each a clean grid of real per-program links with their own credential badge — better structured than the undergrad page. **`catalog.famu.edu` (Acalog) is a dead end and was the wrong site all along** — WAF-blocked AND has no Program entities; the real catalog was never there. See below. |
| FSU | Best data (Power BI dashboard, 550 majors, real per-program AND per-college links) exists but isn't automatable; catalog instead built from plain HTML program-listing pages | No WAF anywhere involved. `academic-guide.fsu.edu/all-programs` (undergrad, clean Views listing) plus three `gradschool.fsu.edu` degree-programs pages (master's/doctoral/specialist, each really a department-contact directory, not a program listing — only the row title is a usable program name). Every entry points at the single `admissions.fsu.edu/majors` page rather than a per-program URL, since this scraper has no way to get or verify individual links — see below for the full Power BI investigation. |
| FIU | Bespoke (predates this batch) | See §7, §9. |

**Before writing a scraper, check for `x-amzn-waf-action: challenge` in the
response headers.** This is AWS WAF Bot Control, and it is common — FGCU, USF,
FAMU, and FlPoly all hit it. **The pattern that emerged: Acalog-hosted
catalogs (FAMU, FlPoly, USF) are consistently WAF-blocked for BOTH `fetch()`
and `curl` in this environment; CourseLeaf-hosted ones (UF, UWF) are usually
not WAF-protected at all, and on the one that is (FGCU) plain `curl` with an
ordinary browser `User-Agent` gets through where `fetch()` doesn't** (the WAF
rule keys off TLS/HTTP client fingerprint, not the User-Agent string). FGCU's
scraper (`scripts/scrape-fgcu-programs.mjs`) shells out to `curl` via
`child_process.execFileSync` — copy that pattern for a CourseLeaf site that
shows this symptom. For an Acalog site, don't expect the curl workaround to
help; USF, FAMU, and FlPoly all confirmed curl fails there too.

**FlPoly and USF both confirmed the next layer of that picture: a real
browser can still get through where curl can't — but only via top-level
navigation, not `fetch()`, even from inside a page that itself loaded fine.**
Navigating the browser tool directly to a WAF-blocked Acalog `content.php` /
`preview_program.php` page works (the WAF's challenge is solved like any
other page load); calling `fetch()` against that same URL from *within* that
already-loaded page's own JS console returns an empty body — the WAF
differentiates by request type (top-level navigation vs. XHR/fetch), not just
by TLS/JS fingerprint. Net effect: for a WAF-blocked Acalog site with real
Program entities, you can still get the data, just not via any
`npm run scrape:*` script — navigate to each page and read the rendered DOM
by hand. That's how both `app/lib/programs/flpoly.ts` (9 undergraduate
department pages + 1 graduate page) and `app/lib/programs/usf.ts` (2 A-Z
index pages, 428 programs total, the largest hand-collected catalog so far)
were built: one browser navigation per page,
`document.querySelectorAll('a[href*="preview_program"]')` (or, for FlPoly's
department pages, filtered to `.textContent.includes('(Program Description)')`)
read out after each. **These two files have no committed scraper and are
edited by hand** — re-verify against the live site if either goes stale, the
same as the 25 original FCS catalogs (§9). **FAMU's WAF-blocked, no-Program-entities `catalog.famu.edu` turned out to be
the wrong site entirely — see below for where its real catalog actually
lives.** The browser-navigation technique wasn't needed there in the end.

**FSU was the one SUS university that never got a per-program-link catalog —
by design, not by giving up early.** Two document-style sites were tried
first and both are bad in different ways: the clean-looking
`academic-guide.fsu.edu/all-programs` is undergraduate-only, and graduate
programs are scattered across dozens of separate department domains
(`business.fsu.edu`, `bio.fsu.edu`, etc.) mixed with contact emails and
nested sub-program variants. `bulletin.fsu.edu` (Coursedog) returns **1,689**
"results" for its programs search — duplicates, "Pre-X" advising tracks, and
catalog-year variants with no clean dedup signal. Not a WAF problem either.

**FSU's actual best data lives at `admissions.fsu.edu/majors`, embedded as a
public Power BI report** — a single table covering all **550 majors** (194
bachelor's, 212 master's, 15 specialist, 127 doctoral, 2 professional), each
row carrying a real per-major program URL AND a real per-college URL. This is
better-structured than any of the document-style sources — if it were
scrapable, it would fully solve FSU in one pass with real per-program links
like FAU/FAMU's catalogs. **It isn't automatable with this session's tools,
and that's a real, well-tested finding, not a shortcut given up on early:**
- The report only renders ~20 rows into the DOM at a time and virtualizes
  the rest. `scrollTop` assignment, synthetic `wheel`/`keydown`/`click`/
  `input` events, and even genuinely trusted OS-level clicks and keypresses
  (via the browser tool, landing on confirmed-correct coordinates, correct
  tab targeting double-checked) are all silently ignored by the report's
  canvas — it appears to require input Power BI's own anti-automation layer
  accepts as genuinely human, which this environment's tooling could not
  produce. The one thing that DOES respond to a normal click is the *outer
  viewer chrome* (zoom controls, fit-to-page) — confirming the canvas
  itself, not general click delivery, is what's gated.
- Also tried and ruled out: clipboard copy/paste (permission denied),
  calling the report's own internal `renderReport()` re-render function
  (re-rendered from cache, issued no new network calls), a blind in-memory
  heap search from `window` for the full dataset (not reachable via any
  enumerable property chain — it's held in a module-private closure), typing
  directly into an already-focused filter combobox, and a second "mobile"
  version of the same report (a different `r` token, same page, linked as
  "Programs of Study Mobile") — identical virtualization, identical
  resistance to interaction.
- **If real per-program FSU links are ever wanted, this is where to pick
  back up**: either a tooling fix for real trusted mouse-wheel scroll (the
  browser tool's `scroll` action requires a working `screenshot` call first,
  which failed with "the Browser pane is not displayed" every time this was
  tried — check whether that's resolved), or a human scrolling through the
  report by hand while an assistant parses pasted text (the row shape is
  simple and already reverse-engineered: `Select Row / Major Name (+ url) /
  B M S D P flags / College (+ url) / Degree Program`).

**The catalog actually shipped takes a different, simpler path, per explicit
direction: use real major names, but just one shared link for every entry
rather than chase individual URLs.** `scripts/scrape-fsu-programs.mjs` pulls
names from FSU's own plain HTML pages instead — no WAF, no Power BI, no
browser needed at all:
- Undergraduate: `academic-guide.fsu.edu/all-programs` — a clean Drupal Views
  listing, one `<h4>Name</h4>` per major, 167 real majors in one `fetch()`.
- Graduate: three `gradschool.fsu.edu` degree-programs pages (master's,
  doctoral, specialist) — each is genuinely a **department-contact
  directory** (photo, name, phone, email per row), not a program listing, but
  every row's own title text (e.g. "Accounting (MAcc)", "Anthropology") is a
  real, usable program name. 137 more real programs, deduped per page.

Every one of the 304 entries links to `https://admissions.fsu.edu/majors`
rather than a per-program page — credentials are spelled out
("Bachelor's"/"Master's"/"Doctoral"/"Specialist") rather than abbreviated,
since these source pages don't state a clean per-program abbreviation for
most entries (the same call NCF's scraper made for its two unlabeled
graduate programs). No new `requestedLevel` matcher fixes were needed — the
spelled-out words already match existing `GRADUATE_HINT`/`BACHELOR_HINT`
patterns (`master`, `doctoral`, `specialist`, `bachelor`).

**FAU was previously on this skip list and turned out to be solvable —
correcting that earlier assessment.** The user pointed out the actual page to
scrape: `www.fau.edu/registrar/university-catalog/catalog/degree-programs/`,
not a per-college prose page. This one page lists every degree type as a
`<h3>` heading (e.g. "BACHELOR OF ARTS (B.A.)"), each followed by its majors —
and FAU has **no per-program catalog page at all**, so a major's only real
link is to its own COLLEGE's catalog page (e.g. "(College of Science)"). That
college link *is* the "school of interest" link this catalog stores for every
program — there is nothing more specific to link to, by design of FAU's own
site. No WAF blocks a plain `fetch()` here, unlike FAMU/FlPoly/USF's Acalog
sites — the earlier "skip" was a survey mistake (looking at the wrong page),
not a real platform blocker.

The page's HTML is inconsistently hand-authored, and `scripts/scrape-fau-programs.mjs`
has to route around several distinct issues before it produces a clean list —
worth reading in full if a similar bespoke registrar page comes up again:
- Some anchors wrap the college name in `"(...)"`; others just write
  `College of Business` with no parens at all — a naive "find the next `)`"
  boundary search bleeds into the *next* major's text when a paren never
  comes. Fixed by capping that search at the position of the next anchor.
- Co-listed majors (two colleges) sometimes close the `<a>` tag early and
  continue the second college's name as plain text before the real `)` —
  e.g. `<a href="...">(College of Arts and Letters</a> and College of
  Engineering and Computer Science)`. The paren-based boundary still finds
  the right end here; it's the anchor-tag-based boundary that would cut it
  short.
- Single-major degree types (e.g. "BACHELOR OF ARTS IN COMPUTER SCIENCE
  (B.A.C.S.)") have no separate major-name line at all — the heading text
  itself names the one major. Falls back to the heading, title-cased and
  stripped of its leading "Bachelor of .../Master of ..." phrase.
- A few stray empty anchors (`<a href="..."><br/></a>`) are copy-paste
  debris with no content, filtered out before they're mistaken for a major.
- Undergraduate/graduate "Minors" and "Certificates" follow the last major
  list with no heading of their own, so an implausibly large gap (or a
  literal "Graduate Certificates"/"Minors" marker) between one anchor and the
  next ends the major list for that degree type rather than ingesting them
  as if they were majors — this is also what stops Ph.D. (the last heading
  on the page) from absorbing the entire page footer.
- "Combined degree" headings (e.g. "B.A./M.A.") mix two credential levels
  under one heading and are skipped entirely — they don't map to a single
  `ProgramLevel`. A.A. (no majors listed), B.S.E. (plain descriptive text,
  no link), and B.G.S. (only a same-page `#bgs` anchor, not a real college
  link) are skipped for the same "no real link" reason. A handful of majors
  tagged "currently on suspension"/"not accepting students" are excluded too.

Result: 156 programs (74 bachelor, 82 graduate) from a single fetch, verified
by hand against a scratch extraction before the scraper was written, and
round-tripped clean in `programCatalogs.test.ts`.

**FAMU was also on the skip list, for the same root cause as FAU: the survey
had been looking at the wrong site.** `catalog.famu.edu` (Acalog) really is
both WAF-blocked and empty of Program entities — that part of the original
assessment was correct — but it was never FAMU's real catalog. The user
pointed to the actual source: FAMU's own site, split across two URLs by
level, neither behind any WAF:
- **Undergraduate** — `www.famu.edu/academics/undergraduate-academics/index.php`,
  one long page with one `<strong>COLLEGE NAME</strong>` heading and one
  college link per section, followed by a plain-text list of "Bachelor of
  ..." majors. No per-major link exists, so — same pattern as FAU — every
  major in a section gets that section's one college link.
- **Graduate** — `graduateschool.famu.edu/graduate-programs/graduate-programs-<slug>.php`,
  one page per college (11 slugs: `cafs`, `coe`, `pharmacy`, `csat`, `cssah`,
  `engineering`, `ahealth`, `saet`, `sbi`, `son`, `soe`), each a clean grid of
  real per-program links with their own credential badge (MS, PhD, MASS,
  MSW, DPT) and title — genuinely better-structured than the undergraduate
  page, closer to UCF/UF's catalogs than to FAU's.

`scripts/scrape-famu-programs.mjs` needed two real fixes past a naive parse,
both in the undergraduate page:
- FAMU uses stray formatting-only `<strong><br><br></strong>` tags between a
  college's own link and its major list. A heading regex that doesn't
  require real letters inside the `<strong>` mistakes one of these for a new
  heading — and then steals the *next* real college's link while losing that
  college's name entirely (the regex's own match already consumed it as
  filler between the bogus heading and the stolen link). Fixed by finding
  real heading text and its nearest link in two independent passes, so a
  formatting-only `<strong>` can never intercept a link meant for the
  college whose name follows it.
- Several majors are offered as "Bachelor of X/Bachelor of Y in Z" (one
  major, two credential options, e.g. "Bachelor of Science/Bachelor of Arts
  in African-American Studies"). Splitting on every "Bachelor of" occurrence
  cuts these into a bogus "Bachelor of Science/" fragment plus a stray
  second major — fixed by only splitting on a "Bachelor of" that isn't
  immediately preceded by "/".

One real exclusion, not a parser bug: a "Community Psychology (coming soon)"
graduate entry links to a bare `/index.php` placeholder rather than a real
page — FAMU's own site marking an announced-but-not-yet-live program. Same
"exclude rather than recommend a dead link" call as UF's suspended Religion
program and FAU's suspended majors.

Result: 103 programs (53 bachelor, 50 graduate) from 12 fetches (1
undergraduate + 11 graduate), round-tripped clean in `programCatalogs.test.ts`
with no new `requestedLevel` matcher fixes needed — every FAMU credential
(`B.S.`, `B.A.`, `B.Arch.`, dual `B.S./B.A.`, `MS`, `PhD`, `MASS`, `MSW`,
`DPT`) was already covered by existing patterns.

**NCF is a special case, not just another platform.** New College of Florida
has no per-credential catalog because it doesn't need one: it confers exactly
one undergraduate degree (the B.A.) across 49 "areas of concentration," listed
cleanly at `ncf.edu/programs/`. Graduate is the opposite problem — no index
page exists at all, just three individually-announced named programs
scattered across the site. `scripts/scrape-ncf-programs.mjs` hardcodes those
three with hand-verified URLs rather than inventing a listing page that
doesn't exist. Two of the three never state a specific credential abbreviation
anywhere on their own pages (just "Master's in X") — the scraper uses the
literal word "Master's" rather than guessing "M.S.", since "master" is already
a recognized `GRADUATE_HINT` keyword and guessing the wrong abbreviation would
be worse than a generic-but-accurate one.

**The round-trip test caught real matcher bugs on every single university so
far, without exception — budget time for this, it is not optional.** All
fixed in `programCatalog.ts`'s `requestedLevel`, never worked around in a
school's data:
- `DEGREE_TRANSITION` (UCF) — an accelerated dual-degree title like
  "Environmental Engineering MSEnvE, Accelerated BS to MSEnvE" is entirely a
  graduate program, but the "BS" naming the accelerated track's entry point
  read as a bachelor's hint. Stripped the credential named right before "to",
  the same shape as `GRADUATE_OF_A_DEGREE`'s existing "AA Graduates" strip.
- `EMBEDDED_DEGREE_FRAGMENT` (UCF) — compound engineering credentials like
  "(B.S.M.S.E.)" (Bachelor of Science in **M**aterials **S**cience and
  Engineering) coincidentally spell "M.S." with no space before it, which read
  as a graduate hint. Fixed by stripping only the no-space-before variant — a
  genuine "M.S." credential is always its own token. **This one is deliberately
  narrow (just `m.s.`/`m.a.`)** — widening it to also catch `a.s.`/`a.a.`/
  `b.s.`/`b.a.` fragments (tried while fixing FGCU's M.P.A.S., below) broke
  PSC's real "B.A.S." (Bachelor of Applied Science) credential, whose trailing
  "A.S." isn't a stray fragment — it's the actual complete credential. Add a
  new short code here only once a real school's data proves it's needed.
- `M.Ed.` and dot-tolerant `mpas`/`mph` (FGCU, UWF) — FGCU and UWF spell
  credentials *with* periods ("M.Ed.", "M.P.A.S.", "M.P.H."), unlike FIU's
  undotted style ("MACC", "MSN") the bare codes in `GRADUATE_HINT` were
  written for. "M.Ed." wasn't recognized at all; "M.P.A.S." and "M.P.H."
  matched *wrong* or not at all — "M.P.A.S." specifically because its embedded
  "A.S." read as an associate degree. Fixed narrowly, one code at a time
  (`m.?ed.?`, dot-tolerant `mpas`, dot-tolerant `mph`) rather than making every
  bare code dot-tolerant at once, for the same regression reason as above.
- `mscj`/`msee`/`msme` (UNF) — the exact same shape again, but UNF's codes are
  bare (undotted, "MSCJ" not "M.S.C.J."), so this isn't a dots problem — it's
  that bare "ms" alone has no word boundary before the two subject letters
  that immediately follow, so it never matches at all. Added the three whole
  codes as new bare alternatives, the same way `macc`/`mha`/etc. already were.
- `m.?arch.?`, dot-tolerant `dba`, and new `dr.?p.?h.?` (USF) — "M.Arch."
  (Master of Architecture) was an entirely new, unlisted code; "D.B.A."
  (Doctor of Business Administration) already had a bare `dba` but, dotted,
  it never matched (same undotted-vs-dotted gap as `mpas`/`mph`); "Dr.P.H."
  (Doctor of Public Health) was new outright. Three separate one-line fixes,
  not one broad change.
- UF's many identically-named bachelor's/graduate majors (e.g. "Accounting" is
  both, unlike FIU/UCF where the credential is embedded in the name) needed a
  real `credential` field joined from UF's separate Graduate Degree Table page
  — see `scripts/scrape-uf-programs.mjs`. One residual case (a "Religion"
  graduate program listed in the sitemap but absent from the active degree
  table) turned out to be a genuinely suspended admission, not a scraper bug —
  excluded outright rather than credentialed, since recommending an
  unavailable program is worse than one fewer listing.
- Dot-tolerant `bm`/`mm`/`mfa` (FAU) — FAU dots every credential letter, the
  same style as FGCU/UWF, so its bare `bm`/`mm`/`mfa` codes had the same
  undotted-vs-dotted gap as `mpas`/`mph`. Only surfaced as a real test
  failure for "Music" (B.M./M.M.) and "Theatre" (B.A./M.F.A.) — FAU has 23
  other same-named bachelor's/graduate pairs, but they all share a
  level-agnostic code (B.S./M.S., B.A./Ph.D., …) that was already
  dot-tolerant, so no other code needed touching.

**Expect this exact failure shape on every remaining university, without
exception — it has happened on every single one so far, no fewer times as the
batch has grown.** A dotted or bare graduate credential either won't match at
all, or will match the *wrong* level via an embedded fragment. The fix is
always the same: check the round-trip test's specific failure, add only the
one code it names, never guess ahead at codes that haven't actually collided.
**Run `programCatalogs.test.ts` immediately after each scrape**, before wiring
the school into `pathwayPrompts.ts`, and read every failure as a real finding
about either the matcher or the data, never as noise to silence.

### Read this before starting: universities are not state colleges

The state-college work was repetitive enough that the fifth batch looked like
the first. **Universities are not.** Reusing the state-college path will produce
confidently wrong pathways. Four real differences:

**1. The pathway shape is different, and there is already a prompt for it.**
A state college starts at an associate and transfers out. A university starts
at the bachelor's — no associate step, no transfer step. `fiuSystemPrompt()`
in `pathwayPrompts.ts` is that shape and is the template to follow, *not*
`collegeSystemPrompt()`. Note the FIU prompt explicitly forbids a transfer
step; the dispatcher branches on `schoolId === "fiu"` today and will need to
become a set or a `kind` lookup.

**2. Transfer agreements mostly don't apply — and that's the point.**
`transferAgreements.ts` exists because state-college students transfer *out*.
Universities are the destination. Most SUS schools should have **no entry**
(like Chipola), and the prompt should omit the transfer section entirely rather
than invent a partner. Do not reflexively fill in all 12.

**3. Graduate programs matter here.** State-college catalogs top out at a
bachelor's. Universities have master's/doctoral programs, and the `graduate`
level in `ProgramLevel` is currently only exercised by FIU. Two consequences:
- `createProgramCatalog(programs, { preferred: "associate" })` is **wrong** for
  a university. FIU uses the default (`bachelor`). Match that.
- Level detection has already bitten us twice (§12). University catalogs will
  introduce more credential codes (`Ed.D.`, `Psy.D.`, `M.Arch`, `LL.M.`…).
  **The `programCatalogs` round-trip test will catch these — run it early and
  read its failures as real findings, not as test noise.**

**4. Catalog platforms differ.** The FCS schools clustered on CourseLeaf,
Acalog, and SmartCatalogIQ. Universities are larger and more bespoke; expect
per-school work and paginated JS-driven catalogs. Survey before writing a
parser.

### Private universities — 6 of 21 done, expect the other 15 to differ again

All 21 are SACSCOC-accredited private (non-state) schools. Full list, from
`floridaSchools.ts` (id — name — city). `miami`, `stetson`, `erau`, `tampa`,
`barry`, and `lynn` are done; the rest are next:

| id | Name | City |
|---|---|---|
| `avemaria` | Ave Maria University | Ave Maria | No per-program URL — see below |
| `barry` | Barry University | Miami Shores | ✅ Done — see below |
| `cookman` | Bethune-Cookman University | Daytona Beach | Not WAF-blocked but nav tree not found yet — see below |
| `eckerd` | Eckerd College | St. Petersburg | Real per-major pages, no stated credential — see below |
| `ewu` | Edward Waters University | Jacksonville | SmartCatalogIQ subdomain exists, no content deployed — see below |
| `erau` | Embry-Riddle Aeronautical University | Daytona Beach | ✅ Done — see below |
| `flagler` | Flagler College | St. Augustine | WAF-blocked — see below |
| `fit` | Florida Institute of Technology | Melbourne | WAF-blocked — see below |
| `fmu` | Florida Memorial University | Miami Gardens | PDF-only catalog — see below |
| `fsc` | Florida Southern College | Lakeland | SmartCatalogIQ subdomain exists, no content deployed — see below |
| `ju` | Jacksonville University | Jacksonville | No catalog subdomain found at all — see below |
| `keiser` | Keiser University | Fort Lauderdale | SmartCatalogIQ subdomain exists, no content deployed — see below |
| `lynn` | Lynn University | Boca Raton | ✅ Done — see below |
| `nova` | Nova Southeastern University | Davie | Catalog site not live yet — see below |
| `pba` | Palm Beach Atlantic University | West Palm Beach | WAF-blocked — see below |
| `rollins` | Rollins College | Winter Park | WAF-blocked — see below |
| `saintleo` | Saint Leo University | St. Leo | WAF-blocked — see below |
| `stu` | St. Thomas University | Miami Gardens | PDF-only catalog — see below |
| `stetson` | Stetson University | DeLand | ✅ Done — see below |
| `miami` | University of Miami | Coral Gables | ✅ Done — see below |
| `tampa` | University of Tampa | Tampa | ✅ Done — see below |

**What UM confirmed and what it didn't.** UM is a large research university
(closer to UF/UCF in catalog size — 492 programs), so it doesn't yet tell us
whether the "size varies enormously" prediction below holds for the small
liberal-arts colleges (Ave Maria, Eckerd, Flagler, etc.) — those are still
unconfirmed. What UM did confirm: real per-program links are achievable even
outside the SUS batch (CourseLeaf, no WAF, one-page fetch — see below), the
university template needed zero prompt changes, and the round-trip test keeps
finding exactly one thing every single time (§13's standing warning below) —
this time three missing `GRADUATE_HINT` codes (`md`, `mps`, `msf`) plus two
real site-data quirks (a truncated title, a mistagged certificate) that
weren't matcher bugs at all. Bulk-checking all scraped URLs return HTTP 200
(not just spot-checking) caught a real bug the round-trip test couldn't: two
rows linked to an external domain and the scraper was blindly prepending its
own origin, producing an unresolvable concatenated URL. Do this full check on
every future school, not just a handful of examples.

**What Stetson confirmed.** Also CourseLeaf, also no WAF (`catalog.stetson.edu`
— confirmed by checking response headers for `x-amzn-waf-action`, same check
that flagged Rollins/Flagler as blocked below), but a genuinely harder scrape
than UM: no single listing page exists at any level, unlike UM's one-page
Program Index. What ended up working: **the sitemap.xml** revealed the site's
real structure at a glance (825 URLs, one glance at path depth and slug
suffixes like `-ba`/`-bs`/`-plan` separated real program pages from course
plans and policy pages) — checking for a sitemap before assuming a school
needs page-by-page crawling is worth doing on every future school. From
there: undergrad uses a tabbed `#majorstextcontainer` UI (3 of the school's 6
top-level undergrad sections are real degree-granting colleges — Arts &
Sciences, Business Administration, Music; WORLD/Discovery/Honors are programs
or centers, confirmed by the tab's absence on those pages) with
heading-grouped `<li>` lists; graduate is loose prose, one heading per program
area with a real link inside the following paragraph. One heading ("Master of
Science (MS)" under Arts & Sciences' counselor-education section) turned out
to cover 4 genuinely distinct sub-programs, each with its own link and its own
fully-descriptive anchor text — extracting by heading alone would have
silently collapsed all 4 into one wrong, too-generic entry. The rule that
handles both shapes (a heading naming exactly one program vs. an umbrella
naming several) is in `scripts/scrape-stetson-programs.mjs`'s header comment;
short version: when a heading's section contains 2+ links whose own text
already states a real credential, trust the links over the heading; when it
contains exactly 1, use whichever of (heading text, anchor text) is longer —
the longer one was the more complete, correct name in every case checked by
hand. Law has no listing page either (11 real programs, hand-identified from
`/law/`'s own nav links, each name taken from its own page's `<title>` rather
than hardcoded, so a future credential-title change on Stetson's own site is
still picked up on a re-scrape). **Zero round-trip mismatches on the first
pass** — spelling the credential out in parens for names that don't already
state one (`"American Studies (Bachelor of Arts)"`, matching FSU's and NCF's
prior "don't guess an abbreviation" precedent) already satisfied existing
`BACHELOR_HINT`/`GRADUATE_HINT` patterns with no new codes needed. **Verified
with a real live Gemini generation**, not just tests — with `GEMINI_API_KEY`
configured, `/pathway?career=Accountant` under the `stetson` cookie returned
two pathways whose every degree-step name matched the scraped catalog
verbatim (`"Accounting (Bachelor of Business Administration)"`, `"Master of
Accountancy"`, `"Finance (Bachelor of Business Administration)"`), and every
step's rendered link resolved to its real `catalog.stetson.edu` page.

**What ERAU confirmed.** Also CourseLeaf, also no WAF (`catalog.erau.edu`).
The cleanest scrape of the three so far — one page
(`daytona-beach/academic-programs/`), one `fetch()`, a plain `<h2>` heading
per credential level (Associates/Bachelors/Masters/Combined Program
Pathways/Dual Masters/Certificates/Doctoral/Ph.D. Programs) each followed by
a `<ul>` of real links, and — unlike Stetson — every entry's own anchor text
already states its complete credential ("B.S. in Aerospace Engineering"), so
no heading-derived name synthesis was needed at all. Associates (2 programs)
and Certificates (1) were excluded, the same call UCF's scraper made for its
own associate-level track: the university template starts every pathway at
the bachelor's, so a level below that isn't a fit. "Combined Program
Pathways" (90 entries) and "Dual Masters" (14) looked like they might be
noise at first glance but are real, individually-linked accelerated/dual-
degree tracks (ERAU's Business and Aviation programs each pair with several
specific graduate programs, e.g. "B.S. in Aeronautics/M.S. in Aviation
Finance"). Zero round-trip mismatches on the first pass, same as Stetson.
**Verified with a real live Gemini generation**: `/pathway?career=Aerospace
Engineer` under the `erau` cookie returned two pathways whose every
degree-step name matched the scraped catalog verbatim (`"B.S. in Aerospace
Engineering"`, `"M.S. in Aerospace Engineering"`, `"B.S. in Mechanical
Engineering"`), each resolving to its real `catalog.erau.edu` page. One
platform-level note for future schools: ERAU runs a **separate catalog per
campus** (Daytona Beach / Prescott / Worldwide / Asia, all under the same
`catalog.erau.edu`) — floridaSchools.ts lists ERAU at Daytona Beach, so only
that edition was scraped; a school with multiple US campuses should be
checked for the same shape before assuming one catalog covers it all.

**What UT confirmed.** The first school in this batch on **SmartCatalogIQ**
(`ut.smartcatalogiq.com`) — a third catalog platform after CourseLeaf and
Acalog, and (like ERAU) not WAF-blocked at all. Unlike UM/ERAU, no single
flat program-index page exists for either level. What worked: the site's own
`/site-map` page is a complete, clean, nested link tree of the *entire*
catalog with real display text on every link (not just raw hrefs, the same
"check for a sitemap first" lesson Stetson's batch taught) — filtered to
links under one of UT's four undergraduate colleges (Arts and Letters,
Natural and Health Sciences, Social Sciences/Mathematics/Education, Sykes
College of Business) whose own text contains "Major" or starts with
"Bachelor of". That college-path restriction is what excludes the sitemap's
real false positives — "Double Majors", "Declaring/Changing Your Advisor or
Major", "Spartan Studies Major Overlap" are all policy pages that happen to
contain the word "major" too, and would have been wrongly captured by a
text-only filter. Graduate came from a separate, hand-curated "Graduate
Degree Programs" page (heading-grouped by college, no name synthesis
needed — same shape as UM's and ERAU's cleanest cases). One round-trip
mismatch on the first pass, and it was the exact same combo-degree shape UM
hit: a "Bachelor of Science in Health Science/3+2 Master of Science in
Athletic Training" accelerated track was stored as `bachelor`, but its own
name contains "Master," so the app's `GRADUATE_HINT` (checked before
`BACHELOR_HINT`) read it as graduate — fixed in the scraper itself (not
`programCatalog.ts`, since this wasn't a missing hint code) by classifying
any undergrad-college entry whose name also names a graduate credential as
graduate, matching how the matcher actually reads it. **Verified with a real
live Gemini generation**: `/pathway?career=Accountant` under the `tampa`
cookie returned two pathways whose every degree-step name matched the
scraped catalog verbatim (`"Accounting Major"`, `"Master of Science in
Accounting"`), each resolving to its real `ut.smartcatalogiq.com` page.

**What Barry confirmed.** The second school on SmartCatalogIQ, and
`barry.smartcatalogiq.com` returns 200 directly (no redirect chain like
UT's). Unlike UT, Barry has a dedicated, purpose-built "Programs of Study"
page per catalog level (undergrad and grad each get one) — a SmartCatalogIQ
built-in widget (`id="sc-program-links"`) listing every linked program on
one page, so UT's sitemap-filtering trick wasn't needed at all. **Check for
this exact page shape on any future SmartCatalogIQ school before falling
back to UT's sitemap approach.** Both pages mix real programs with policy
pages, bare specialization/concentration tracks that don't carry their own
credential ("Biochemistry Specialization", "Forensic Psychology
Specialization"), and certificates — none of which state a credential in
their own title, which is what separates them from every real program.
Filtering on "does the title contain a real credential token" (bachelor's
family for undergrad, graduate family for grad) cleanly separates the three.
One regex gap found and fixed: a bare `\bdoctor\b` doesn't match inside
"Doctorate" — the word boundary fails at the "-ate" suffix — which silently
excluded "School of Law Juris Doctorate Program" until the pattern became
`doctor\w*`. A few undergrad entries were the same UM/UT combo-degree shape
("Kinesiology and Sport Sciences (B.S. KHPUS to M.S. KHPS SEPPG Seamless)")
and got the same fix as UT's: reclassify as graduate when the name also
names a graduate credential. Zero round-trip mismatches after that fix.
**Verified with a real live Gemini generation**: `/pathway?career=Social
Worker` under the `barry` cookie returned two pathways whose every
degree-step name matched the scraped catalog verbatim (`"Bachelor of Social
Work (B.S.W.)"`, `"Master of Social Work Degree Program"`, `"Psychology
(B.S.)"`), each resolving to its real `barry.smartcatalogiq.com` page.

**What Lynn confirmed.** No catalog platform vendor at all — a bespoke site
(`lynn.edu/academics/catalog`) behind **Cloudflare bot protection**, a
different mechanism than the AWS WAF Bot Control on the Acalog schools but
the same net effect: every plain `fetch()`/`curl` to the *entire domain*
(even the bare homepage) returns HTTP 403 "Attention Required! |
Cloudflare", confirmed by testing both `lynn.edu/` and a specific catalog
page — while a real browser's top-level navigation gets through cleanly.
This is a **hand-verified file, no committed scraper**, the same category as
`flpoly.ts`/`usf.ts`. The real find: Lynn's catalog has no flat
program-index page anywhere, but every catalog page shares one
server-rendered left-nav menu that itself lists all 93 raw entries in the
whole catalog (undergrad day / online / graduate divisions × 6 colleges) as
real links, each with its own credential in a nested `<span>` — so the
entire catalog came from reading that one shared menu on a single page load
rather than crawling Lynn's own per-division/per-college hierarchy the
"obvious" way. **Check any bespoke-site school for a shared nav/sitemap
component before assuming a per-page crawl is needed** — the third time in
this batch alone (after UT's `/site-map` and Barry's `programs-of-study`
widget) that the real shortcut was a site-wide list hiding in plain sight. A
real extraction bug surfaced and got fixed: naively stripping the
credential span's text from the anchor's full `textContent` via `.replace()`
corrupted names whose full text *starts with* the credential and repeats it
in the span (e.g. name "Master of Science in Psychology" + span "Master of
Science" → `.replace()` matched the leading occurrence instead of the
trailing duplicate, producing "in PsychologyMaster of Science") — fixed by
cloning the anchor, removing the span node, then reading the clone's
`textContent`. Associate-level (7 entries) and the one certificate were
excluded, the same call as UCF/ERAU/Barry. Zero round-trip mismatches.
**Verified with a real live Gemini generation**: `/pathway?career=Marketing
Manager` under the `lynn` cookie returned two pathways whose every
degree-step name matched the catalog verbatim (`"Marketing (Bachelor of
Science)"`, `"Master of Business Administration in Marketing"`,
`"Advertising and Public Relations (Bachelor of Arts)"`), each resolving to
its real `lynn.edu` page — confirmed by browser navigation, since bulk URL
checking via `curl` doesn't work on this domain either.

**Rollins College, Flagler College, Florida Tech, Palm Beach Atlantic, and
Saint Leo are all WAF-blocked**, the same pattern as FAMU/FlPoly/USF in the
SUS batch: all five run Acalog (`catalog.rollins.edu`, `catalog.flagler.edu`,
`catalog.fit.edu`, `catalog.pba.edu`, `academiccatalog.saintleo.edu` — found
via `saintleo.edu/academics/academic-affairs/catalogs`, a different
subdomain naming than the other four but the same platform and the same
block), and all five return HTTP 202 with an `x-amzn-waf-action: challenge`
header on the actual `content.php` program pages (the bare `index.php`/
homepage loads fine — it's the program content specifically that's gated).
Per §13's browser-navigation technique (discovered during the SUS batch: a
real browser doing a top-level navigation gets through an Acalog WAF that
blocks both `curl` and in-page `fetch()`), these are very likely solvable
the same hand-collection way FlPoly's and USF's catalogs were — that hasn't
been tried yet for any of the five.

**More dead ends surveyed, not yet resolved:**
- **Ave Maria University's catalog (`catalog.avemaria.edu`) has no real
  per-program or per-department URL at all.** It's a client-rendered Next.js
  single-page app — `/programs` lists all 81 real programs cleanly (36
  majors, 38 minors, 7 graduate, correctly categorized with department and
  credential), but every program card is a `<button>`, not a link; clicking
  one (or its expand control) never changes `location.href`, confirmed by
  checking it directly after each click. If this school gets picked up
  later, apply the FSU precedent: real names, one shared link
  (`https://catalog.avemaria.edu/programs`) rather than a fabricated
  per-program URL.
- **Bethune-Cookman (`catalog.cookman.edu`) is Acalog but NOT WAF-blocked**
  (`index.php?catoid=41` returns a plain 200, unlike the five above) — but
  its catalog navigation tree isn't in the static HTML either (no
  `content.php`/`navoid` links found), so whatever loads it is a mechanism
  not yet identified. Worth a real browser session to find before assuming
  it needs the same workaround as the WAF-blocked schools.
- **St. Thomas University's and Florida Memorial University's catalogs are
  both PDF-only.** `stu.edu/academics/course-catalogs/` and
  `fmu.edu/academics/catalogs-courses/` both link straight to PDFs (no HTML
  catalog page exists at either school). Needs either PDF text extraction
  (not yet attempted for any school in this project) or hand entry; the
  "no listing page" workarounds used for Stetson/UT/Barry/Lynn all depend on
  some HTML page to read — neither school has one.
- **Eckerd College has real per-major pages but none of them state a
  credential.** `eckerd.edu/academics/majors/` lists ~41 real majors with
  real per-major links (e.g. `eckerd.edu/biology/`), but neither that page,
  the individual major pages, nor the general academics pages mention
  "Bachelor" anywhere — confirmed by a text search across several pages.
  Eckerd's own PDF catalog almost certainly states the credential per major,
  but the per-major HTML pages don't, and guessing whether a given major is
  B.A. or B.S. would violate "never invent school data." Needs either PDF
  extraction or a source that states credentials, neither found yet.
- **`catalog.nova.edu` is a live CourseLeaf placeholder** ("A New Courseleaf
  Site Coming Soon!") — not yet usable regardless of NSU's own separate
  "expect NSU-scale" sizing warning below.
- **`<school>.smartcatalogiq.com` resolves but serves no real content** for
  Florida Southern, Keiser, and Edward Waters — the bare subdomain returns
  "Layout Not Found" (Sitecore's own 404-equivalent) and neither UT's
  `/en/current/catalog` nor Barry's `/en/<year>/undergraduate-catalog` path
  guesses resolve either. These are reserved-but-unused SmartCatalogIQ
  subdomains, confirmed distinct from Barry's and UT's instances (both of
  which serve real content immediately at their own subdomain — and, per
  Eckerd's and Lynn's resolutions, distinct from what those two schools'
  real catalogs turned out to be: not on SmartCatalogIQ at all, despite each
  also having a reserved-but-empty `<school>.smartcatalogiq.com` subdomain).
  Each remaining school's real, currently-published catalog URL needs to be
  found via that school's own registrar/academics page — the way Barry's
  (`barry.edu/en/registrar/catalogs/`), Saint Leo's
  (`saintleo.edu/academics/academic-affairs/catalogs`), Eckerd's
  (`eckerd.edu/academics/majors/`), and Lynn's (`lynn.edu/academics/catalog`)
  were all found — rather than another subdomain guess.
- **Jacksonville University has no `catalog.*`/`bulletin.*`/
  `*.smartcatalogiq.com` subdomain at all** (403 from CloudFront/S3 on the
  SmartCatalogIQ guess) — needs a full fresh platform survey from scratch.
- **Edward Waters University is a trap, not just a miss**: guessing
  `catalog.ewu.edu` returns a real, live, 200-OK CourseLeaf catalog — for
  **Eastern Washington University**, an entirely different school on the
  other side of the country that happens to share the "EWU" short name.
  Always confirm the school name in the page's own `<title>` before trusting
  a subdomain guess, not just the HTTP status code.

**Don't assume the SUS playbook just repeats.** Some real differences to
expect, not yet confirmed against any specific school (survey each before
assuming):
- **Size varies enormously.** NSU is a large research university (likely
  closer to UF/UCF in catalog size); Ave Maria, Eckerd, Flagler, and similar
  small liberal-arts colleges may have well under 50 total programs. Don't
  be surprised by a tiny catalog — that's not a broken scrape, it's the
  school. Keiser and ERAU are career/professional-focused and may structure
  degrees around licensure tracks rather than traditional majors.
- **Tuition is very likely flat-rate, not resident/non-resident split.**
  Private schools charge the same tuition regardless of Florida residency —
  unlike every SUS school and state college so far. If a school's cost data
  is a single flat number, that's expected; don't force it into the
  `outOfStateAmount` shape that only makes sense for public schools.
- **Transfer agreements probably still don't apply, but check per school
  rather than assuming.** No private school currently has a
  `transferAgreements.ts` entry, and per the same logic as UCF/FIU/FAU/etc.
  (these are destinations, not origins) most should stay that way — but a
  few private schools actively recruit AA transfer students with named
  articulation programs, so don't rule it out reflexively the way point 2
  above says not to invent one; just don't assume the answer without
  looking.
- **Catalog platforms will vary by vendor just as much as they did for SUS
  schools** — expect the same CourseLeaf/Acalog/bespoke/Kuali spread, the
  same possibility of a WAF, and the same possibility that the platform
  survey needs a second look (as FAU's and FAMU's did) before concluding a
  school is hard.
- **No obvious pilot school stands out the way UCF did for the SUS batch.**
  Consider starting with a smaller school (lower risk if the catalog turns
  out messy) to re-validate the university template still fits, before
  tackling NSU-scale schools.

### The mechanical part (unchanged from the FCS batches)

Per school: scrape → `app/lib/programs/<id>.ts` → register in **three** places:
`schoolCatalogs.ts`, `programCatalogs.ts`, `pathwayPrompts.ts`
(`COLLEGE_SHORT_NAMES` + `COLLEGE_PROGRAMS`, or the university equivalent) →
extend the test tables → verify in a browser.

**Key on the `floridaSchools.ts` id, not the filename.** This already bit us:
`dsc.ts` is `daytona`, `ssc.ts` is `seminole`. A mismatch produces a catalog
nothing can reach and nothing fails loudly.

### Verification bar

Every batch so far ended with: `npx tsc --noEmit` clean, `npm test` at the known
433/434 (the one known failure is `fiuCoverage`, unrelated to any given batch —
see §12), **all scraped URLs confirmed HTTP 200**, and one live end-to-end
pathway generated in a real browser with its program links checked. That last
step caught bugs the first three missed every single time — including a 29-URL
break in Daytona State's catalog where the school's own index linked to a dead
path. Keep it.
