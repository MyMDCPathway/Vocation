# 📋 Changelog - Vocation

All notable changes to this project will be documented in this file.

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

