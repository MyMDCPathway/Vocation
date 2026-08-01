# 📋 Changelog - Vocation

All notable changes to this project will be documented in this file.

---

## Unreleased — branch `Vocation-2.0`, part 9: a look of its own

Restyled against a reference the owner supplied (Podia): warm sand
background, scattered geometric confetti, very heavy tightly-tracked
headings, solid near-black buttons, and a curved arc handing off between
bands.

### No nav bar

The header is gone from the intake and the plan. There is exactly one thing to
do on these pages and a row of links is an invitation to do something else.
The wordmark sits centred above the question instead — rendered once by
`StepShell`, so every step gets it and it can't drift between screens.

The career screen is now a proper hero: centred, 72px heading, no progress bar
(a "step 1 of 8" before you've typed anything says *form*), and the confetti
turned up. Inner questions keep their left-aligned heading and a quieter set of
three shapes.

### Tokens, not a repaint

`--sand`, `--ink`, and `--pop-*` are a **separate** palette from `--school-*`.
Those retint at runtime from whichever school is selected and are load-bearing
on the pathway pages (HANDOFF §6); the intake is school-agnostic, so it's built
from the constant set instead. Both are exposed through Tailwind, so the sweep
was a token change rather than a pile of hex codes.

### Confetti that can't get in the way

Pure CSS shapes — squircle, triangle, hexagon, fan, pill — because they're a
few polygons, they need to pick up the palette, and a dozen image requests for
decoration is a waste. All of it is `aria-hidden`, `pointer-events: none`, and
pinned to `z-0` under `z-10` content, so a blob sitting over the career input
can never swallow the click. The gentle drift animation is disabled under
`prefers-reduced-motion`, along with the older letter and fade animations.

### Fixed during development

- **The page scrolled sideways.** The arc divider's pseudo-element is 160% wide
  so the curve stays shallow at any viewport, but with `overflow: visible` that
  overhang was real layout width — measured at **1645px inside a 1265px
  window**. The confetti was innocent; its field already clipped correctly.
- The career examples were six degree jobs, which advertised the wrong product
  after part 7. Now `doctor · electrician · nurse · welder · cloud engineer ·
  graphic designer` — a degree, a trade, a credential, a certification, a
  talent path.
- Rail step dots now use the accent palette per step kind, so a trade route
  reads as mostly orange and a degree route as mostly blue before you read a
  word of it.

### Notes

- Inter is now loaded at 800/900; at 700 the headings read noticeably lighter
  than the reference.
- Verified at 1265px and 375px: no horizontal overflow, heading scales 72 → 44,
  and the confetti thins to two shapes on mobile so it frames rather than
  crowds.
- 729 tests, unchanged. `fiuCoverage` remains the only failure.

---

## Unreleased — branch `Vocation-2.0`, part 8: the path builds as you answer

The intake was: answer eight questions, receive a plan. That's a form. The
student gives eight answers on faith, and if they abandon halfway they leave
with nothing.

Now a route sketch appears as soon as the career is known and stays beside
every remaining question, sharpening as answers arrive. Verified live for an
electrician in Miami:

**At the very first question after the career** — no degree anywhere, because
the archetype from part 7 shapes the outline:

```
High school diploma or GED         4 years
Apprenticeship application & test  3-6 months
Paid electrical apprenticeship     4-5 years
Journeyman licensing exam          1-2 months
Journeyman Electrician
                                   about 9 years of this left
```

**After answering location** — the three training steps pick up `Near Miami`.

**After answering education** — high school strikes through to `Already done`,
the apprenticeship test becomes the active step and reveals its detail, and the
estimate drops to `about 5 years` with *"You've already cleared 20% of it."*

### It costs nothing extra

The outline comes back from the **same** `/api/refine-career` call that already
classifies the route, so there is no new request. Enrichment is pure and local
(`pathOutline.ts`) — regenerating on every answer would be five Gemini calls
per intake and a spinner between every question. The model supplies the
skeleton once; the app annotates it from answers it already holds. The real
costed plan is still generated at the end, and the rail says so.

### Non-degree routes no longer generate degree ladders

Part 7 sent welders to union halls but `openSchoolPrompt` still said *"the
starting program — always first, type 'degree'"*, so the plan came back as a
diploma ladder anyway. It now follows the archetype. Generated live against
IBEW Local 349 JATC:

```
Inside Wireman Apprenticeship        IBEW Local 349 JATC
Paid Apprenticeship Work Experience  on-the-job
Miami-Dade County Journeyman Exam    the real county licensing body
```

The archetype is also part of the pathway cache key — two routes through one
provider are different answers and can't share an entry.

### Fixed during development

- **A JSX comment placed inside `{cond && ( … )}`** broke the whole build with
  a misleading error pointing at the first element in the file, ~30 lines
  above the actual mistake. Only one expression is allowed in that position.
- `Roughly about 9 years` — the sentence and the helper were both hedging.

### Notes

- `clearedBy` is set per step by the model and compared by **rank**, so a
  master's clears a bachelor's step. It's deliberately optional: an
  apprenticeship is not cleared by holding a degree, and inferring it from
  position would claim otherwise.
- The rail is sticky beside the question on desktop, and collapses behind a
  Show/Hide control on mobile so it can't push the actual question off screen.
- 729 tests (19 added). `fiuCoverage` remains the only failure.

---

## Unreleased — branch `Vocation-2.0`, part 7: not every career runs through college

Asked about welding, Vocation confidently produced a list of universities.
That isn't a missing feature — it's a wrong answer, and wrong in the way that
costs trust fastest. The app still carried its Miami Dade College DNA: pick a
school, get a degree, here's the cost. True for a doctor, false for most of the
working world.

The route is now classified **before** any route-specific question is asked,
and the rest of the intake follows it.

### Seven routes

| Route | Example | What the student is shown |
|---|---|---|
| `degree` | Pediatrician | Universities |
| `credential` | Registered nurse | Accredited programs + licensure board |
| `apprenticeship` | Welder, electrician | Union halls, contractors, trade schools |
| `certification` | Cloud engineer | Certification bodies, bootcamps |
| `enlistment` | Military | Branches and recruiting entry points |
| `talent` | Basketball player | Academies, leagues, overseas circuits |
| `direct-entry` | Truck driver | Employers, short licences |

Classification happens inside the existing `/api/refine-career` call, so it
costs nothing extra. Verified live — every one of these came back right:

```
welder            → apprenticeship  "paid union apprenticeships or trade school"
electrician       → apprenticeship  "IBEW locals run four- to five-year paid…"
registered nurse  → credential      "licensed by state nursing boards…"
cloud engineer    → certification   "hired on demonstrated skill and vendor certs"
pediatrician      → degree          "4-year medical degree then residency"
basketball player → talent          "gated by ability, scouting, performance"
truck driver      → direct-entry    "CDL through a short training course"
```

Note `cloud engineer → certification`, not `degree`. The prompt is explicit
that the **dominant real route** wins over the most prestigious one — plenty of
developers hold CS degrees, but the field hires on demonstrated skill.

### What actually changed for a welder

Before: 53 Florida colleges plus AI universities. After, same city, same query:

```
Miami Dade College                    welding certificate
Lindsey Hopkins Technical College     career certificate, Welding
Ironworkers Local 272 JATC            $0 — paid 4-year apprenticeship
Pipefitters Local 725 JATC            $0 — paid 5-year apprenticeship
Sheridan / McFatter / Robert Morgan   technical colleges
```

Not one university, and the two union locals cost **nothing** — the prompt now
says outright that where a route pays the trainee, print 0 rather than
inventing a tuition figure.

The whole step changes vocabulary with the route: *"Any of these
**apprenticeships** you already have in mind?"* over *"Union halls,
contractors, and trade schools near you that take on apprentices. **Most of
these pay you while you train.**"*

The degree path is untouched — pediatrician in Miami still returns 51 catalog
schools plus 5 AI, nearest-first.

### Fixed during development

- **The refine-career failure path skipped the location question entirely**,
  jumping straight to the profile. That left the plan with no country, so the
  profile quoted a default market and `/plan` bounced the student home for an
  incomplete intake. It survived the part-4 step reorder because it sits one
  indent level deeper than the success path rewritten alongside it.

### Notes

- The `refine` cache namespace is bumped to `refine2`. Entries cached before
  classification existed have no route, and serving one would silently fall
  back to `degree` — reintroducing the exact bug. One regeneration per career
  buys the guarantee.
- `degree` is the fallback for anything unrecognised, deliberately: showing a
  degree path for a job that doesn't need one gives the student an expensive
  option they can decline, whereas telling a future surgeon they can start
  tomorrow does not fail safe.
- The archetype is part of the discovery cache key — the same career in the
  same city returns union halls or universities depending on it.
- 710 tests (17 added). `fiuCoverage` remains the only failure.

---

## Unreleased — branch `Vocation-2.0`, part 6: the schools map

The schools step is now a map beside a nearest-first list. Hovering a row
lifts its pin and pans to it, clicking either selects, and the search box
finds schools we never suggested.

### The first dependency in a while, and why

`leaflet` — the project's fifth runtime dependency. HANDOFF rule 8 says don't
add one "for something small", and this is the exception rather than a breach:
a pannable, zoomable tile map is not small. Hand-rolling it means tile
arithmetic, pointer-driven pan, wheel zoom, and marker projection — which is
reimplementing Leaflet, badly. It needs no API key and no account, and
OpenStreetMap's tiles are free with attribution (which is rendered — it's
required, not optional). Google Maps and Mapbox both want a billing account.

Leaflet is dynamically imported, so it stays in its own chunk rather than the
initial bundle. The home page goes 5.5 kB → 14.7 kB (first load 105 → 111 kB).

### Schools now have coordinates

Catalog schools take them from the hand-compiled table in `geography.ts`;
AI-discovered schools get them from the discovery call, validated by
`hasUsableCoordinates` before anything is pinned. **(0, 0) is rejected** — it's
in the Gulf of Guinea, and a model filling the field because the schema asked
looks exactly like that. A school we can't place is still listed, just without
a pin, and the map says how many.

That also fixed a quieter thing: AI-discovered schools used to carry
`distanceMiles: null` always, so "nearest first" only meant anything in
Florida. They're now measured like everything else, and **distance is computed
per request rather than stored** — the cache key is country/region/city/career
and doesn't include the student's exact coordinates, so a stored distance would
hand the second student in a city the first one's mileage.

### Search finds any school, not just our suggestions

Typing filters the loaded list; when nothing matches, **Find it** looks that
school up anywhere in the world via the new `/api/school-lookup` and folds it
into both list and map. It returns up to three candidates when a name is
genuinely ambiguous — "Cambridge" is two famous universities on two continents
— rather than guessing. Verified: searching Harvard from Miami added it at
1,256 mi with its real tuition, and the map refit to include it.

### Fixed during development

- **Every pin was missing.** Leaflet is imported dynamically, so on the render
  where the schools arrived the map didn't exist yet; the marker effect
  returned early and — because its dependency (the school list) had already
  settled — never ran again. The result was a fully working, tiled, attributed
  map with nothing on it. Now gated on a `ready` flag set when the map is
  built.
- **Schools appeared twice.** The discovery prompt excludes Florida's *public*
  colleges because we hold those, but Barry and the University of Miami are
  private — so they came from our catalog *and* the model, and were listed
  twice with two pins a few hundred metres apart. Deduped on a normalised
  name, with the catalog copy always winning.
- Markers use `divIcon` (plain HTML), never Leaflet's default image icons —
  those resolve through relative paths that bundlers rewrite, which is the
  classic "popups work, markers invisible" bug.

### Notes

- The map fits the schools rather than hardcoding the United States. A US
  student gets a US map because that's where their schools are; the Edinburgh
  student from part 2 gets Scotland, without the map needing to know which.
- Scroll-wheel zoom is off by default. The map sits in a scrolling page, and
  hijacking the wheel means someone scrolling past it gets zoomed instead.
- 693 tests (14 added). `fiuCoverage` remains the only failure.

---

## Unreleased — branch `Vocation-2.0`, part 5: one location question at a time

The location step asked for country, region, city, and postal code all on one
scrolling screen. Every other question in the wizard asks exactly one thing;
this one didn't, and it read as a form dropped into the middle of a
conversation.

`LocationStep` is now four small screens — country, then region, then city,
then (optional) postal code — each with its own back button, still living
inside one entry in the wizard's outer step list. The outer "Step X of Y"
counter doesn't advance across the four; it doesn't need to know there are
four of them, any more than it needs to know the schools step has its own
internal search box.

Selecting a country or a region advances immediately, same as every other
single-pick question in the wizard (education level, budget priority). City
and postal code still need an explicit **Continue**, because they accept free
text and a stray keystroke shouldn't submit early.

**Back is a real back**, not an exit. Pressing it from postal returns to city,
from city to region, from region to country, and only from country does it
hand off to the wizard's own back button. Re-entering the step (student
answered the next question, then pressed back) picks up on the last question
they'd answered rather than marching them through all four again.

Nothing about *what* gets asked changed — same fields, same optional postal
code, same `usesPostalCode`/`postalLabel` gating from part 4. This is purely
the one-screen-per-question restructuring.

679 tests, unchanged. `fiuCoverage` remains the only failure.

---

## Unreleased — branch `Vocation-2.0`, part 4: local pay, and postal codes

### Location now comes before the profile

Pay, demand, and the entry route on the career profile are for the student's
own market instead of a default. For a UK student asking about electricians
that changes more than the currency:

| | Before (US default) | After (UK) |
|---|---|---|
| Pay | `$61,590` | `£36,000` (£22,000 – £48,000) |
| Entry route | "apprenticeship or trade school" | "NVQ Level 3 Diploma through a four-year apprenticeship, plus the AM2 practical exam" |

The profile is cached per career **and** country, so the two don't collide.

### Postal code, done for the whole world rather than the US

New optional field after city: country → region → city → postal code.

**It is not called a ZIP code.** ZIP is a USPS trademark for a US-only system.
The field is labelled per country — Postcode, PIN code, Eircode, CEP, CAP — and
**hidden entirely** for the ~60 countries with no postal system at all (UAE,
Hong Kong, Panama…). A test asserts no country outside the US ever sees the
word "ZIP".

**It earns its place by resolving to coordinates.** Before this, distance to a
school could only be computed inside Florida, because the only coordinates the
app held were its own school table and the student's location was matched by
city *name*. Everyone else got "closest to home" ranked by whatever order
discovery happened to return. A resolved postal code gives real latitude and
longitude anywhere the service covers, so great-circle distance now works
worldwide. A field we collect and never use would be worse than not asking.

Lookup is `api.zippopotam.us` — free, no key, no account, and it returns place,
region *and* coordinates in one call. Alternatives weighed:

| Option | Why not |
|---|---|
| Google Places | The industry default, but needs a billing account and an API key |
| Nominatim / OSM | Free, but capped at 1 req/sec by policy, and it missed UK and Canadian partial codes that Zippopotam resolved |
| GeoNames | Good data, needs a registered username, throttles the free tier |

If this ever needs to be bulletproof, shipping a GeoNames postal dump as static
data removes the third party from the request path entirely.

### Fixed during development

- **Correctly-typed postcodes were failing.** Verified against the live
  service: `EH8 9YL` misses, `EH8` hits; `M5V 2T6` misses, `M5V` hits;
  `1012 AB` misses, `1012` hits. UK, Canadian and Dutch data is keyed on the
  first segment only — so the lookup failed for precisely the people who typed
  their address correctly. It now retries progressively coarser truncations.
  These are **truncations, never substitutions**: every candidate is a prefix
  of what they typed, so the worst case is a broader area that still contains
  them. A test asserts that property.
- A transient upstream failure is no longer cached as a definitive miss.

### Notes

- The postal code never overwrites a city or region the student chose — it only
  fills a gap. People know their own address better than a lookup table does.
- Debounced at 600ms; most prefixes of a valid code are not themselves valid.
- 679 tests (22 added). `fiuCoverage` remains the only failure.

---

## Unreleased — branch `Vocation-2.0`, part 3: the career profile

A screen between "which career" and the questions that build a plan, showing
what the job actually is before anyone commits years to it: photos, what the
work looks like day to day, pay, hiring outlook, time to get there, adjacent
careers, and links worth opening.

It sits **after** any narrowing question, so it describes the specific job they
settled on — pay for "doctor" before they've said which kind would span a GP
and a neurosurgeon. Broad careers still get the follow-up question first; that
machinery already existed and is unchanged.

### Photos come from Wikipedia, not from the model

The model is never asked for an image URL. Two reasons, either sufficient:

1. **It's the hallucination problem in its worst form.** A wrong program URL
   404s and gets caught. A wrong *image* URL either 404s or — far worse —
   resolves to a real photograph of something else entirely, and nothing short
   of looking at it can tell the difference.
2. **Licensing.** Hotlinking whatever image a model names means publishing
   someone's copyrighted photo on a page we ship to students.

So photos come from the Wikipedia article's own media, which gives free
licences with the metadata to attribute them, editorial curation (images in the
"Marine biology" article were chosen by editors to illustrate marine biology,
where a raw image search returns whatever matched the words), and no API key or
new dependency. Attribution is rendered — most are CC BY-SA, which requires it.

The model *is* asked which Wikipedia article to look at, which is a thing it's
reliably good at. Playing to that split is the whole design.

### Resources are verified, not just listed

Every link the model proposes gets fetched with the same machinery as program
URLs. Dead ones are dropped rather than falling back — a licensing board has
nowhere to degrade to — and the page says how many went.

### The prompt is told not to flatter the job

A career page that only lists upsides is worse than useless: the student finds
out the truth after paying for two years of study. The prompt requires the
unglamorous parts, and `Competitive` / `Shrinking` are real options that render
amber and red. In practice it produces things like *"desirable day-shift
positions at prestigious hospitals are highly competitive, while night shifts,
rural facilities, and nursing homes struggle to fill spots"* and *"entry-level
shop jobs pay modestly; the highest-paying work often requires traveling long
distances."*

### Fixed during development

- **Every career rendered with zero photos** while both Wikimedia requests
  returned 200. The REST media list spells a file
  `File:Florence_Nightingale_(H_Hering).jpg` and the Commons query spells the
  same file `File:Florence Nightingale (H Hering).jpg`, so matching them
  literally never succeeded. Unit tests used spaces on both sides and passed —
  only a live run surfaced it.
- **Gemini's 503 read as a flat error.** "High demand, try later" is retryable
  and happens often enough to deserve its own message; the profile step now has
  a **Try again** button rather than stranding people.
- `1 more didn't and were dropped` — singular/plural.
- The first photo is above the fold, so it loads eagerly rather than lazily.
- The progress label said **Question** N of M on a screen that isn't a
  question. It's **Step** now.

### Notes

- Pay is shown for a named market, labelled on the page. The profile is asked
  for before the location question, so that's usually the United States; the
  route already accepts a country code and uses it when one is known. Moving
  the location question earlier would make pay and demand local from the start.
- 657 tests (19 added). `fiuCoverage` remains the only failure.

---

## Unreleased — branch `Vocation-2.0`, part 2: open-world schools

Vocation now plans against **any school in the world**, not only the 53 Florida
schools whose catalogs were scraped.

### How this doesn't reintroduce the bug the scraping fixed

HANDOFF §2 records why every school got scraped: asked for pathways
unconstrained, Gemini confidently returned MDC degrees that don't exist, and
instructing it to be careful didn't help. Planning open-world reintroduces that
risk — so the model now has to make a **checkable** claim instead of just a
confident one.

Along with each program it must state the URL of that program's page. The
server fetches it. Three outcomes, following rule 7 (prefer no link over a
wrong link):

| Outcome | Meaning | What the student sees |
|---|---|---|
| `verified` | The page loaded and is a real program page | Direct link, "Program page confirmed" |
| `fallback` | It didn't, but the school's program index did | Link to the index, "Specific page not found" |
| `unverified` | Neither resolved | No link at all |

A soft 404 counts as a failure. Universities serve "page not found" with HTTP
200 constantly, so status codes alone would mark most dead links as verified —
`urlVerify.ts` checks the `<title>`, known not-found phrasings, and whether the
request got bounced to the site root.

**This is weaker than a scraped catalog and the UI says so.** Every plan carries
a banner stating which of the two it is, and AI-sourced plans report how many
program pages actually resolved.

### New

- **Country → region → city.** All ~190 countries with flags derived from ISO
  codes. Regions are fetched per country and cached rather than shipped —
  hand-typing ISO 3166-2 would be ~5,000 rows entered from memory, and a wrong
  province is invisible until someone from there can't find where they live.
- **`/api/find-schools`.** Real institutions near the student that could lead to
  *their specific career*, with tuition in local currency plus USD. Florida's
  catalog schools are merged in and marked as the stronger source.
- **`/api/regions`.** Subdivisions and their main cities, per country.
- **`urlVerify.ts`.** The verification described above, plus an SSRF guard —
  these URLs come from a model whose input includes free text a student typed,
  and the server fetches them. Loopback, private ranges, cloud metadata
  (`169.254.169.254`), and non-http schemes are refused before any request.
- **`openSchoolPrompt.ts`.** The URL-claiming prompt, told outright that its
  URLs get fetched. Builds around how education works in the student's country
  rather than defaulting to the American model.
- **Confidence banners and per-step badges** so catalog-backed and AI-sourced
  plans are never mistaken for each other.

### Fixed during development

- **Verified links recovered from stale URL suffixes.** Asked for Heriot-Watt's
  marine biology degree, the model returned `…/marine-biology.htm`; the real
  page is that exact path without the `.htm`. Every degree step on that plan
  lost its link over four characters — **0 of 4 verified**. The verifier now
  retries mechanical rewrites of the *same* path (drop the extension, toggle the
  trailing slash), each still fetched and checked. Same plan now verifies
  **2 of 2**, linking the genuine program pages.
- **US financial aid no longer described to non-US students.** A student in
  Edinburgh was told they'd "likely qualify for a partial Pell Grant" — a
  programme they cannot apply to — while nothing was said about the SAAS
  funding that actually pays their fees. `estimateAid` now takes the student's
  country and declines to model outside the US.
- **School discovery ran twice per plan.** The schools step and `/plan` each
  called `/api/find-schools` with identical arguments, doubling the Gemini cost
  of every plan. The result is carried forward in the intake.
- **`Open to anywhere in the us`** — the plan summary lowercased option labels.

### Removed

- `/api/plan-tracks`. Track resolution no longer needs a catalog (discovery
  already returns career-relevant schools), so it's a pure function called
  client-side. That also retires `relevanceScore` and its prefix-matching.

### Notes

- The Florida catalog path is **byte-identical** to before. Two route tests
  deep-equal the response against their fixture and 411 seed entries hold that
  shape, so nothing is stamped onto it — the plan page reads provenance from
  the school record instead.
- 638 tests (68 → 106 new). `fiuCoverage` remains the only failure, unchanged.

---

## Unreleased — branch `Vocation-2.0`

> **Naming note:** the branch is called "Vocation 2.0" after the product
> redesign. It is unrelated to the "Version 2.0.0" entry further down, which
> was a feature release on `main` some time ago. Git refuses spaces in branch
> names, so the branch itself is `Vocation-2.0`.

### The flow is inverted

1.0 asked **which school are you at**, then generated one pathway from that
school's catalog. That is backwards: most students can't name a school until
they know what they're studying, and it produces one answer where the real
question has several.

2.0 opens on **what career do you want** and derives the schools from
everything the student says afterwards, then plans the same career three ways.

**Old:** select school → press Start → look up career → one pathway
**New:** career → job specifics → location → education level → finances →
desired schools → budget priority → work mobility → three priced routes

### New

- **Career-first landing page.** `/` is now the first question. The old hero,
  school picker, and Start button are gone, along with the dead
  pathway-generation code path `app/page.tsx` carried (HANDOFF §8/§9 flagged it
  for deletion or wiring; this deletes it).
- **`/api/refine-career`.** Asks Gemini whether a career is already specific
  enough to plan against. "Doctor" gets a specialty question with real options
  and their residency lengths; **"BCBA" gets no question at all** and skips the
  step. Also returns a career-specific note on how location flexibility affects
  entry, which becomes the help text on the mobility question.
- **`/api/plan-tracks`.** Turns a completed intake into up to three schools —
  closest, cheapest, and the one the student named. No Gemini call, no rate
  limiting. Server-side because it reads every catalog to score relevance.
- **`/plan`.** The three routes side by side, each priced. Tracks that resolve
  to the same school collapse into one card carrying both badges, so a Miami
  student who names MDC generates once rather than three times.
- **`geography.ts`.** Main-campus coordinates for all 61 schools and 17 Florida
  regions, so "closest to home" is a real answer. Regions rather than ZIP
  codes: no geocoder dependency and no address to store.
- **`planCost.ts`.** Generalizes cost estimation beyond MDC. Every figure
  carries a `basis` — `listed` (curated for that school in `universities.ts`)
  or `sector` (a band for its sector). Wide honest bands beat narrow invented
  numbers, and rule 1 says never invent school data.
- **Gated financial breakdown.** The headline range and the aid outlook are
  free; itemization, net-of-aid price, living costs, and year-by-year cash flow
  are behind a "Vocation Plus — coming soon" panel. The locked rows are **not
  rendered at all** rather than blurred: everything is computed client-side, so
  a CSS blur would be readable in devtools. A real paid tier has to move that
  computation behind an authenticated server route.

### Fixed during development

- **Local track ignored proximity.** Relevance scoring filtered the candidate
  pool before the "closest to home" pick, so a Miami student asking about
  pediatricians was sent to Eastern Florida State College — 184 miles away —
  because two schools statewide happen to list *Pediatric Cardiac Sonography*
  and *Pediatric Respiratory Care*. The local track now uses the unfiltered
  list, and relevance filtering requires a broad match (5+ schools) before it
  is trusted at all.

### Unchanged on purpose

- `/pathway` still works and is linked from the footer as "Classic search".
- The school cookie, `SchoolProvider`, and server-side theming are untouched
  (HANDOFF §6). The intake is school-agnostic and renders Vocation's own blue.
- `/api/generate-pathway` is unmodified. The three tracks each call it once, so
  canonicalization, all three cache layers, and rate limiting apply exactly as
  before, and a track someone already generated costs nothing.

### Tests

68 added (606 total). The `fiuCoverage` failure documented in HANDOFF §8 is
still the only failing test and is unrelated — the ratio is unchanged at
166/651.

---

## Version 2.0.0 - Major Feature Update

### 🎉 New Features

#### 1. **Career Discovery Quiz** 
- Added interactive multi-step questionnaire to help students discover careers that match their interests
- 8 comprehensive questions covering:
  - Interests and passions
  - Work environment preferences
  - Salary expectations
  - Education level willingness
  - Work-life balance priorities
  - Work type preferences
  - Team vs. independent work style
  - Career motivations
- Powered by Gemini AI for personalized career recommendations
- Displays 6-10 career matches with detailed information:
  - Career title and description
  - Match reasoning (why this career fits the user)
  - Salary ranges
  - Job outlook
  - Competitiveness level
- Direct integration: Click "View Career Pathway" from results to automatically generate pathway
- Accessible from pathway page subtitle link
- Smooth transitions and progress tracking throughout the quiz

#### 2. **Financial Tracker**
- Added comprehensive cost estimation for each pathway step
- Cost breakdown includes:
  - MDC Associate degrees: ~$7,200 (60 credits × $120/credit)
  - MDC Certificates: ~$3,000
  - MDC Bachelor's: ~$13,500 (remaining 60 credits after A.A./A.S.)
  - 4-year university transfer: ~$13,000 (2 years at public university)
  - Licensure exams: $175-$1,200 (varies by exam type)
- Features:
  - Total pathway cost summary with expandable breakdown
  - Individual step cost display in each flowchart card
  - Cost comparison across multiple career pathways
  - All costs clearly marked as estimates
  - Beautiful green-themed UI for financial information

#### 3. **Career Disambiguation System**
- Improved career input handling for broad terms (e.g., "nurse", "software", "mechanic")
- Shows 3-6 specific career options before pathway generation
- Each option includes:
  - Detailed description
  - Salary information
  - Job outlook
  - Competitiveness rating
- Prevents invalid inputs and guides users to specific career paths
- Enhanced API prompts to handle broad career categories intelligently

### ✨ Enhancements

#### User Experience
- Improved search bar animations with typewriter effect
- Added input validation with word/character limits (5 words or 50 characters)
- Real-time word/character counter with smooth fade transitions
- Enhanced error messaging with better visual feedback
- Smooth transitions between pathway steps and career options
- Improved loading states with Gemini-branded indicators
- Better visual hierarchy and spacing throughout the application

#### Pathway Display
- Full-width pathway display (removed container constraints)
- Better visual hierarchy and spacing
- Enhanced pathway card styling with cost information
- Improved responsive design for mobile devices
- Cleaner flowchart presentation

#### Navigation & Flow
- Streamlined pathway generation flow
- Auto-generation when coming from career discovery (seamless integration)
- Improved "Clear Pathway" functionality (refreshes to initial state)
- Better state management for pathway comparisons
- Consistent navigation patterns throughout the app

### 🐛 Bug Fixes

- Fixed issue where broad career terms were incorrectly marked as invalid
- Resolved input restoration after clearing pathway
- Fixed typewriter effect not retriggering after pathway clear
- Improved JSON parsing robustness for Gemini API responses
- Fixed pathway display appearing before career options
- Resolved animation timing issues with search bar fade-in/out
- Fixed cost calculation for various exam types
- Fixed search bar flash when selecting career from suggestions
- Improved URL parameter handling to prevent unwanted input restoration

### 🔧 Technical Improvements

- Added new API endpoint: `/api/career-assessment` for quiz functionality
- Enhanced `/api/get-career-suggestions` with better prompt handling and increased token limits
- Improved error handling and logging throughout the application
- Better state management for complex UI flows
- Optimized API calls and response parsing
- Added comprehensive cost calculation function
- Improved TypeScript type safety
- Better component organization and structure
- Enhanced code comments and documentation

### 📝 Code Quality

- Added comprehensive cost calculation function with detailed logic
- Improved TypeScript type safety across components
- Better component organization and structure
- Enhanced code comments and documentation
- Consistent code formatting and style

---

## Migration Notes

- No breaking changes for existing users
- All existing pathways continue to work as before
- New features are opt-in (career discovery quiz is accessible via link)
- Financial tracker automatically appears on all new pathway generations

---

## Known Limitations

- Cost estimates are approximations based on average tuition rates
- Actual costs may vary based on:
  - Residency status (in-state vs out-of-state)
  - Financial aid and scholarships
  - Program-specific fees
  - University choice for transfers
- Exam costs are estimates and may vary by state/region
- Career discovery quiz recommendations are AI-generated and should be used as guidance

---

**Release Date:** Novemeber 30 2025  
**Version:** 2.0.0  
**Build:** Production Ready

---

## Previous Versions

### Version 1.0.0 - Initial Release
- Basic pathway generation functionality
- MDC program integration
- Transfer pathway support
- Licensure exam information
- Pathway comparison feature

