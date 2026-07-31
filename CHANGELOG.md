# 📋 Changelog - Vocation

All notable changes to this project will be documented in this file.

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

