# Vocation — Project Handoff

Everything a new developer needs to work on this codebase safely. Written
2026-07-25, last updated **2026-07-30** against commit `f662876` on `main`.

Read the **Rules** section before writing code. Several of them exist because
the obvious approach has already failed here in a way that wasn't visible until
production.

> **All 61 Florida schools are done. The catalog-building project is complete.**
> All **12 SUS public universities are done**, and all 21 private (SACSCOC)
> schools are wired up: **University of Miami**, **Stetson University**,
> **Embry-Riddle Aeronautical University** (Daytona Beach campus),
> **University of Tampa**, **Barry University**, **Lynn University**,
> **Rollins College**, **Flagler College**, **Palm Beach Atlantic
> University**, **Florida Institute of Technology**, **Saint Leo
> University**, **St. Thomas University**, **Ave Maria University**,
> **Bethune-Cookman University**, **Eckerd College**, **Florida Memorial
> University**, **Jacksonville University**, **Keiser University**,
> **Florida Southern College**, **Nova Southeastern University**, and
> **Edward Waters University** (the last one). Stetson's, ERAU's, UT's,
> Barry's, Lynn's, Rollins's, Flagler's, PBA's, FIT's, Saint Leo's, STU's,
> Ave Maria's, Bethune-Cookman's, Eckerd's, FMU's, JU's, Keiser's, FSC's,
> NSU's, and EWU's generations were all verified fully live end-to-end — a
> real Gemini call through a locally-running dev server, with
> `GEMINI_API_KEY` set — and every returned step name matched the scraped
> catalog exactly, with every program link resolving to its real page. UM's
> verification stopped short of that (no API key was available in that
> session); if you want that gap closed, re-run one live UM generation now
> that a key exists.
>
> **What's left is maintenance, not new schools**: keep catalogs current as
> schools add/retire programs, and watch for the same recurring failure
> mode — a new credential code (bare or dotted) colliding with an existing
> `GRADUATE_HINT`/`BACHELOR_HINT` token. The `programCatalogs` round-trip
> test is the trip-wire; read its failures as real findings.
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
> **Rollins** was the seventh private school and the first to confirm the
> browser-navigation WAF bypass actually works on this exact platform for a
> school outside the FlPoly/USF pair it was first found on: `catalog.rollins.edu`
> is Acalog behind AWS WAF Bot Control, returning HTTP 202 with
> `x-amzn-waf-action: challenge` on both `content.php` and
> `preview_program.php` for `curl`/`fetch()` alike, while a real browser's
> top-level navigation gets through cleanly on every page tried. Rollins is
> also the first school in this batch to publish **four** separate catalogs
> instead of the usual undergrad+grad pair — College of Liberal Arts
> (traditional day undergrad, 37 majors), Hamilton Holt Undergraduate
> (adult/evening undergrad, 13 majors), Hamilton Holt Graduate (8 real
> degrees), and Crummer Graduate School of Business (4 MBA delivery tracks).
> Hamilton Holt Undergraduate was **deliberately excluded**: 7 of its 13
> majors share an exact subject name with a College of Liberal Arts major
> (Business Management, Communication Studies, Economics, Education -
> Elementary Education, Self-Designed, Music, Psychology) but a different
> poid/URL and even a different stated credential — Holt's own Degree
> Requirements page says "Bachelor of Arts" generically, while CLA's states
> its classical "Artium Baccalaureus (A.B.)" — and folding both catalogs
> into one flat list would put two same-named bachelor's entries in one
> bucket with no way for a query to pick the right physical page;
> `createProgramCatalog`'s `find()` would silently return whichever was
> pushed first. College of Liberal Arts was kept as the one bachelor's
> catalog (larger, and the flagship day program a prospective undergraduate
> would actually enroll in) — the same "pick the one campus/division that
> matches the school's normal meaning" call ERAU's batch made among its
> several campuses. Every College of Liberal Arts major confers the exact
> same credential ("A.B.") regardless of subject — the same one-degree-many-
> majors shape as NCF's B.A., confirmed by that catalog's own Degree
> Requirements page rather than assumed. One real, site-stated dead program
> was excluded, not linked: "Social Innovation"'s own page states the major
> "will be discontinued effective Fall 2024... New declarations of the SI
> major will cease effective Fall 2023" — the same "exclude a suspended
> program rather than recommend it" call as UF's Religion program and FAU's
> suspended majors. On the graduate side, "Professional Training Option" and
> three teacher-certification/endorsement "Sequences" were excluded after
> each one's own page confirmed it's a certification track riding alongside
> an already-listed M.A.T., not a standalone degree. Every one of the final
> 49 program poids was cross-checked against a fresh DOM extraction right
> before shipping (curl-based bulk URL verification doesn't work on this
> domain either, the same finding as Lynn's) — zero discrepancies, and zero
> round-trip mismatches on the first pass despite "A.B." being a credential
> shape (`BACHELOR_HINT`'s `b\.?a\.?` alternative requires a "b" before an
> "a", so it doesn't match Rollins' letters-reversed "A.B." at all) with no
> precedent elsewhere in the batch — it happened not to matter because no
> Rollins program shares a name across two levels, so no new matcher code
> was needed; this is a real latent gap worth remembering if a future
> school's "A.B." program ever collides by name with a graduate entry.
> **Verified with a real live Gemini generation**: `/pathway?career=Accountant`
> under the `rollins` cookie returned two pathways whose every degree-step
> name matched the catalog verbatim (`"Business Management (A.B.)"`,
> `"Early Advantage MBA (M.B.A.)"`, `"Economics (A.B.)"`), each resolving to
> its real `catalog.rollins.edu` page.
>
> **Flagler** was the eighth private school and confirmed the Rollins-found
> WAF bypass generalizes again: `catalog.flagler.edu` is Acalog behind AWS
> WAF Bot Control, same HTTP 202 + `x-amzn-waf-action: challenge` on both
> `content.php` and `preview_program.php`, same clean top-level-navigation
> workaround. Flagler has its own built-in Acalog "Programs of Study (A-Z)"
> widget (`content.php?catoid=13&navoid=355`) — the same shape Barry's
> catalog used — listing all 98 Program entities (majors, minors,
> certificates, endorsements, graduate) on one page; no sitemap or per-page
> crawl needed. Cross-checked independently against Flagler's own marketing
> site (`www.flagler.edu/academics/degrees-programs`, a Drupal Views table
> with the same Major/Minor/Graduate/Certificate flags) which states "42
> majors leading to a bachelor's degree, two master's degree programs" —
> matching this catalog's count exactly, a strong two-source confirmation.
> **Unlike Rollins/NCF's one-degree-for-every-major shape, Flagler's own
> Acalog "Degree Requirements" page states it confers three different
> bachelor's credentials (B.A., B.S., B.F.A.) depending on the major** — so
> every one of the 42 majors needed its own credential hand-checked on its
> own program page (most state it in prose, "will earn a Bachelor of
> Science degree"; a few state it inline instead, e.g. History's page reads
> "The History major (BA) consists of..." — both forms were checked for
> every single entry, none guessed or assumed from the subject name; a
> business-adjacent major being B.A. instead of B.S. or vice versa was
> genuinely not guessable in advance, e.g. Business Administration → B.A.
> but Finance and Accounting → B.S.). Two subjects (Fine Arts, Graphic
> Design) turned out to each offer both a standard major AND a separate,
> more intensive BFA track as two distinct real programs with their own
> pages and their own poids — confirmed by reading each page rather than
> assuming a duplicate listing was a scraping error; kept as two distinct
> catalog entries since collapsing them would either lose a real option or
> collide two same-named bachelor's entries in one lookup bucket (name
> disambiguates, credential field is left unset for these two to avoid a
> redundant double-credential render). Flagler's own site abbreviates
> "Master of Public Administration" as "MPA" (undotted) — already covered
> by `GRADUATE_HINT`'s existing bare `mpa` code, no new matcher code needed.
> All 44 final poids were cross-checked against a fresh DOM re-extraction
> right before shipping (curl-based bulk URL verification doesn't work on
> this domain either) and came back with zero discrepancies; zero
> round-trip mismatches too. **Verified with a real live Gemini
> generation**: `/pathway?career=Accountant` under the `flagler` cookie
> returned three pathways whose every degree-step name matched the catalog
> verbatim (`"Accounting (B.S.)"`, `"Finance (B.S.)"`, `"Business
> Administration (B.A.)"`), each resolving to its real `catalog.flagler.edu`
> page.
>
> **PBA** was the ninth private school, the largest catalog in this batch by
> far (136 real programs — 91 bachelor's, 45 graduate — versus Barry's 84 or
> Flagler's 44), and the third straight confirmation the Rollins/Flagler WAF
> bypass generalizes: `catalog.pba.edu` is Acalog behind AWS WAF Bot Control,
> same HTTP 202 + `x-amzn-waf-action: challenge`, same clean top-level-
> navigation workaround. Has its own built-in "Programs of Study" widget
> (the Barry/Flagler shape) on **both** its undergraduate and graduate
> catalogs, split into tabs, each grouped by real degree type (Bachelor of
> Arts, Bachelor of Science, Master of Divinity, Doctor of Pharmacy, ...)
> with the credential already stated in the program's own title — and, a
> genuine first for this batch, Acalog's own listing does the discontinued-
> vs-live split for you: a literal "Discontinued Programs" group sat
> alongside the real ones, so those were excluded without having to check
> each one's own page for a suspension notice the way every prior school
> required. One exclusion did need its own page checked: "Business
> Administration, B.A." states outright "may only be taken as a student's
> second major" — since this app's whole model is one bachelor's program as
> the pathway's first and only starting step, a major that can't legally be
> a student's first (and only) major has no valid slot to fill and was left
> out; "Business Administration, B.S." remains as the real, standalone way
> to study the subject. Two "3+2" combined bachelor's-to-master's programs
> ("Master of Accountancy 3+2", "Master of Business Administration 3+2")
> turned out to be filed as two separate real Program entities apiece — one
> under the undergraduate catalog's "Bachelor of Science" heading, one under
> the graduate catalog's own heading — describing the same pipeline from
> each audience's side; kept only the graduate-side copy of each (matching
> how `GRADUATE_HINT`'s bare "master" token would read the name regardless
> of which catalog it came from) rather than shipping two same-named,
> same-level, different-URL duplicates that `find()` could only resolve
> arbitrarily. A third 3+2 ("Business Data Analytics 3+2") is the same
> duplicate-filing shape but its own page frames the output as "an
> opportunity to earn a bachelor's degree in business," so the
> *undergraduate*-side copy was kept instead and the graduate-side duplicate
> dropped — the standalone graduate destination for that pipeline is the
> separately-listed "Master of Science in Business Data Analytics." Two
> more graduate entries ("Master of Arts, Christian Studies (MACS)",
> "Master of Divinity (M.Div.)") are real, independently-pursuable base
> degrees confirmed on their own overview pages ("an opportunity to
> concentrate," not a requirement to) but link to a content.php page rather
> than a preview_program.php Program entity, since Acalog never gave the
> unconcentrated base degree its own Program record — same "real link, just
> not a Program-entity one" shape as ERAU's/NCF's/FAU's shared links. **The
> round-trip test caught a real, new matcher gap, exactly as every prior
> university in this batch has**: "Biology: Concentration in Graduate School
> Preparation, B.S." was resolving to nothing, because `GRADUATE_HINT`'s
> bare `graduate` token matched the word "Graduate" inside "Graduate
> School" — a concentration that prepares a student *for* graduate school
> later, not a graduate-level program itself. Fixed with a new
> `GRADUATE_SCHOOL_PHRASE` strip in `programCatalog.ts` (`/\bgraduate\s+
> school\b/gi`), stripped before the level checks run, the same shape as
> the existing `GRADUATE_OF_A_DEGREE` strip for Broward's "AA Graduate" —
> a real English word meaning something other than "this program is
> graduate-level" in context. All 134 final poids (plus the 2 content.php
> links) were cross-checked against a fresh DOM re-extraction right before
> shipping, with zero discrepancies. **Verified with a real live Gemini
> generation**: `/pathway?career=Accountant` under the `pba` cookie returned
> two pathways whose every degree-step name matched the catalog verbatim
> (`"Accounting, B.S."`, `"Master of Accountancy"`, `"Finance, B.S."`,
> `"Master of Accountancy and Analytics"`), each resolving to its real
> `catalog.pba.edu` page.
>
> **FIT** was the tenth private school and the fourth straight confirmation
> the Rollins/Flagler/PBA WAF bypass generalizes: `catalog.fit.edu` is
> Acalog behind AWS WAF Bot Control, same HTTP 202 +
> `x-amzn-waf-action: challenge`, same clean top-level-navigation bypass.
> Unlike Rollins/PBA, FIT runs a single combined catalog (not split by
> undergrad/grad) with one comprehensive "Degree Programs" page
> (`content.php?catoid=20&navoid=1245`) listing all 217 raw entries grouped
> by College/Department, then by Undergraduate/Graduate — the same
> one-page-has-everything shape UM's and UNF's catalogs had, and every
> entry already states its own credential in the title, so no separate
> `credential` field was needed anywhere in this file. 11 real
> Associate-level entries (A.A./A.S., e.g. "Air Traffic Control, A.A.")
> were mixed into the undergraduate subsections and excluded, the same call
> ERAU's/UCF's/Barry's scrapers made for their own associate tracks — this
> is a STEM/aviation-heavy school, so several subjects (Aviation Management,
> Aeronautical Science, Aviation Meteorology, Aviation Human Factors &
> Safety, Aviation Administration) offer BOTH a standard and a "- Flight"
> track as two distinct real bachelor's programs, and Aviation Management
> additionally splits into a B.A. and a B.S. — all kept as separate entries
> since each is real, differently named, and separately admitted. One
> credential, "Doctor of Aviation, Av.D.", is a code with no precedent
> anywhere in this project, but its own full name already contains the bare
> word "Doctor," so `GRADUATE_HINT` reads it correctly with no new code
> needed. One other, "STEM Education, Ed.S.", uses an Ed.S. (Education
> Specialist) code `GRADUATE_HINT` doesn't recognize at all (it only covers
> `ed.d.`) — flagged here as a real, confirmed gap, but left unfixed because
> nothing in this catalog collides by name with it, so the round-trip test
> had nothing to fail on; add an `eds` code if a future school's data
> actually proves the gap matters, not before. Zero round-trip mismatches on
> the first pass otherwise. All 155 final poids were cross-checked against a
> fresh DOM re-extraction right before shipping, with zero discrepancies.
> **Verified with a real live Gemini generation**:
> `/pathway?career=Aerospace Engineer` under the `fit` cookie returned two
> pathways whose every degree-step name matched the catalog verbatim
> (`"Aerospace Engineering, B.S."`, `"Aerospace Engineering, M.S."`,
> `"Mechanical Engineering, B.S."`), each resolving to its real
> `catalog.fit.edu` page.
>
> **Saint Leo** was the eleventh private school and closes out every
> WAF-blocked Acalog school this project ever identified (Rollins, Flagler,
> PBA, FIT, and now Saint Leo — the browser-navigation bypass has now gone
> 5 for 5). Same platform, same HTTP 202 + `x-amzn-waf-action: challenge`,
> same clean top-level-navigation workaround. Saint Leo splits into two
> catalogs like PBA/Rollins (`catoid=77` undergraduate, `catoid=76`
> graduate), each with one comprehensive page listing every program grouped
> by college/department then degree type — no separate `credential` field
> needed anywhere in this file, every name already states its own
> credential. One real duplicate needed resolving: "Business Administration,
> B.A." is listed twice, once "(Offered only at University Campus)" and
> once "(Offered only through Worldwide)" — two different poids for the
> same literal major name, which `normalizeProgramName`'s parenthetical
> stripping would otherwise collide on; kept only the University Campus
> copy, the same "pick the one division that matches the school's normal
> meaning" call Rollins's batch made. One entry needed its name corrected,
> not just transcribed: the graduate catalog's own anchor text for one
> Master of Education concentration read only "Educational Leadership
> Concentration," missing the parent-degree prefix its sibling entries in
> the same list all had — its own page confirmed the fuller name in prose
> ("The Master of Education with a concentration in Educational
> Leadership"), so this file uses "Master of Education: Educational
> Leadership Concentration" to match its siblings, the same "trust the
> page's own fuller text over an inconsistent anchor" call Stetson's
> scraper made. **This is the first Acalog school in the entire private
> batch to pass the round-trip test with zero matcher fixes needed on the
> first try** — Saint Leo's credential codes (B.A., B.S., B.S.N., B.S.W.,
> M.A., M.S., Ed.D., Ed.S., DBA, "Doctor of..." spelled out) were all
> already covered by existing `GRADUATE_HINT`/`BACHELOR_HINT` patterns. All
> 83 final poids were cross-checked against a fresh DOM re-extraction right
> before shipping, with zero discrepancies. **Verified with a real live
> Gemini generation**: `/pathway?career=Accountant` under the `saintleo`
> cookie returned two pathways whose every degree-step name matched the
> catalog verbatim (`"Accounting, B.S."`, `"Master of Science in
> Accounting"`, `"Finance, B.S."`), each resolving to its real
> `academiccatalog.saintleo.edu` page.
>
> **STU** was the twelfth private school and the first genuinely new
> extraction approach in this whole project: **St. Thomas has no HTML
> catalog at all** — `stu.edu/academics/course-catalogs/` links straight to
> two PDFs (undergraduate, 313 pages; graduate, 256 pages), no WAF, plain
> WordPress hosting, `curl` works fine. Text was extracted locally with the
> `pdf-parse` npm package, installed in a scratch directory and never added
> to this project's `package.json` (per the "don't add a dependency for
> something small" rule). Every program was found via its own real section
> heading in the extracted text (e.g. "BACHELOR OF ARTS (BA) IN ENGLISH"),
> cross-checked against the PDF's own table of contents, which matched on
> every single entry but one (a TOC typo for "Master of Accounting" that
> even contradicts the TOC's own stated section range — trusted the
> page-marker-derived value instead). URLs use the PDF's own `#page=N`
> fragment (honored by every major browser's native PDF viewer) rather than
> one shared link to page 1 — confirmed accurate by cross-referencing
> `pdf-parse`'s own page array against its inserted page-boundary markers,
> which line up with the PDF's own printed page numbers with zero offset,
> and independently re-confirmed by reading the raw PDF page STU's own live
> Gemini pathway linked to and finding the expected program header exactly
> there. Two exclusion calls of the same shape seen elsewhere in this batch:
> generic "Specialization in X" tracks any business major can pair with
> (Business Management, Economics, Finance, ...) have no independent
> credential and were excluded, and three Joint JD/graduate-degree programs
> were excluded because each requires separate admission to STU's School of
> Law, a professional program with its own catalog this project doesn't
> cover — the same "the other half of this combined program lives in a
> catalog we don't have" reasoning that's kept a bare JD out of every
> school's catalog in this project so far. **The round-trip test caught a
> real, new matcher gap**: STU's four "BA-JD in X" accelerated law-track
> programs (Political Science, Criminal Justice, English, Psychology) are
> entirely bachelor's-level — the student enrolls as a normal undergrad,
> and "JD" names the eventual destination, not this program's own level —
> but bare `jd` is a real `GRADUATE_HINT` token, so it was outranking the
> "BA" right next to it and resolving to nothing. Fixed with a new
> `BA_JD_PATHWAY` strip in `programCatalog.ts` (`/\bba[\s/-]*jd\b/gi`), the
> same "a degree code names something other than this program's level"
> shape as the existing `DEGREE_TRANSITION` strip for UCF's "BS to
> MSEnvE". **Verified with a real live Gemini generation**:
> `/pathway?career=Accountant` under the `stu` cookie returned two pathways
> whose every degree-step name matched the catalog verbatim
> (`"Bachelor of Business Administration (BBA) in Accounting"`, `"Master of
> Accounting - Public Accounting Specialization"`), each resolving to its
> real PDF page — independently confirmed by reading that exact page of the
> downloaded PDF and finding the matching program header.
>
> **Ave Maria** was the thirteenth private school and the first
> client-rendered-SPA catalog: `catalog.avemaria.edu/programs` is a Next.js
> app with no per-program URLs at all — clicking a program card (or its
> expand control) never changes `location.href`, and the only network
> traffic is Next.js RSC/Server-Action calls, never a JSON endpoint. Every
> program was read directly out of the rendered DOM. The page's own
> "Majors (36) / Minors (38) / Graduate (7)" tab badges don't match what's
> actually there: the DOM was confirmed NOT virtualized (container
> `scrollHeight === clientHeight`, `overflow: visible`, so nothing lazy-loads
> on scroll) and a full extraction found exactly 38 Minor cards and 7
> Graduate cards — both matching their badges — but only 33 Major cards,
> alphabetically continuous A-through-Z with no gap, so the "36" badge
> appears to be stale on the site's own end rather than a missed card. Two
> of those 33 majors (Biology, Exercise Physiology) offer both a B.A. and a
> B.S., bringing the true bachelor's count to 35. Same call as FSU: one
> shared, always-correct link (`https://catalog.avemaria.edu/programs`)
> beats a guessed or fabricated per-program URL. No new matcher gap this
> time — the round-trip test passed clean on the first try. **Verified with
> a real live Gemini generation**: `/pathway?career=Accountant` under the
> `avemaria` cookie returned a pathway whose degree steps matched the
> catalog verbatim (`"Accounting (BA)"`, `"Business Administration (MBA)"`),
> each resolving to the real shared catalog URL.
>
> **Bethune-Cookman** was the fourteenth private school and closed out a
> question the earlier survey had left open: `catalog.cookman.edu` IS Acalog
> behind AWS WAF Bot Control after all, same as Rollins/Flagler/PBA/FIT/
> Saint Leo — `content.php` and `preview_program.php` both return HTTP 202
> with `x-amzn-waf-action: challenge` under `curl`, confirmed directly.
> Earlier survey passes had only tried `index.php` (a plain 200), which is
> why HANDOFF previously logged this school as "not WAF-blocked" with an
> unidentified nav-tree mechanism — the nav tree isn't a different mechanism
> at all, it's the same WAF gate every other Acalog school in this batch
> has. The same browser-navigation bypass got through cleanly. Both catalogs
> (undergraduate `catoid=51`, graduate `catoid=55`) have one comprehensive
> "Academic Programs" page listing every major, minor, certificate, and
> non-degree program with a real `preview_program.php?catoid=&poid=` link
> each — the same best-case shape UM and Saint Leo had. Undergraduate titles
> already state their own credential (`"Accounting, B.S."`), so no separate
> `credential` field was needed there, the same "name already carries the
> code" shape Saint Leo's and STU's files use; graduate titles were
> inconsistent about it (some inline, like `"(MBA)"`; others, like "Master
> in Health Equity" and "Master of Athletic Training", state none at all),
> so graduate entries carry a `credential` field read off each program's own
> page instead. Excluded: all 30 minors, all 5 certificates (3 undergraduate,
> 2 graduate), the two non-degree Air Force ROTC entries, and "Integrated
> Environmental Science 3+2 (B.S./M.S.)" — an accelerated track combining two
> already-separately-listed standalone degrees (the B.S. major and the M.S.)
> under one name with no single ProgramLevel to assign it without guessing.
> `area` was left off entirely: the catalog's four colleges each have their
> own page, but none enumerate their majors in scrapable form, just
> mission/vision prose naming a handful in passing — not a complete,
> verifiable list, so guessing the rest by subject would be inventing an
> administrative grouping rather than reading a real one back. No new
> matcher gap this time. **Verified with a real live Gemini generation**:
> `/pathway?career=Accountant` under the `cookman` cookie returned a pathway
> whose degree steps matched the catalog verbatim (`"Accounting, B.S."`,
> `"Master of Business Administration"`), each resolving to its real
> `catalog.cookman.edu` per-program page.
>
> **Eckerd** was the fifteenth private school and closed a dead end this
> project's own survey had flagged: its real per-major pages
> (`eckerd.edu/biology/`, etc. — plain HTTP, no WAF, curl works fine) state
> no credential anywhere, confirmed again by a fresh text search. The
> credential data lives in an entirely different document: Eckerd's own PDF
> course catalog (176 pages, linked from `eckerd.edu/catalog/` as a Google
> Drive file), extracted locally with `pdf-parse` the same way STU's and
> Bethune-Cookman's files needed it, but for a different reason — here the
> real per-program pages exist and work, they just omit the one fact this
> project needs. The PDF's own "Bachelor of Arts Degree" section states the
> college approves "a list of 42 majors," matched exactly by counting its
> own official major/minor legend. Every major confers a B.A. by default; a
> named subset can also earn a B.S. by taking more Natural-Sciences-
> Collegium courses — but that subset turned out to be a per-department
> policy, not the fixed 8-major list the catalog's own summary blurb names,
> which is exactly what individually checking all 42 majors' own sections
> caught: Environmental Studies and Psychology both offer a B.S. despite
> neither being in that blurb's named list. Two majors (Biochemistry, Marine
> Science) are B.S.-only. One real judgment call, the same "the other half
> of this program lives somewhere we don't have" shape that excluded STU's
> joint JD programs: Theatre's B.F.A. (and Musical Theatre's only degree,
> period) is awarded solely through a 2+2 partnership with Circle in the
> Square Theatre School in New York, requiring separate admission to that
> school — confirmed by reading the partnership's own terms (Eckerd accepts
> 63 transfer credits FROM Circle in the Square, capping other transfer
> credit entirely for those students). Theatre's on-campus B.A. stays;
> Musical Theatre is excluded outright since it has no other form. Creative
> Writing's B.F.A. is NOT the same shape — an ordinary on-campus add-on
> sequence — so both its B.A. and B.F.A. stayed in. A second real catch from
> reading full department sections rather than trusting a shared URL:
> "Comparative Literature" and "Literature" share one department web page
> but are two separate, real majors with distinct requirements and
> comprehensive-exam course codes (`LC498` vs `LI498`) — kept as two
> entries — while "English"/"Literature" and "Art"/"Visual Arts" really are
> single majors under two searchable names (the catalog's own "VISUAL ARTS"
> section literally reads "See Art."), confirmed the same way. No new
> matcher gap this time. **Verified with a real live Gemini generation**:
> `/pathway?career=Accountant` under the `eckerd` cookie returned a pathway
> whose first step, `"Business Administration (BA)"`, matched the catalog
> verbatim and resolved to the real `eckerd.edu/management/business-
> administration/` page.
>
> **FMU** was the sixteenth private school and a dead end that turned out to
> be wrong on inspection: HANDOFF had flagged `fmu.edu/academics/catalogs-
> courses/` as PDF-only, "same obstacle St. Thomas had" — but that page only
> links the full 200+ page catalog PDFs. Two other real HTML pages exist and
> were never checked: `fmu.edu/academics/undergraduate-degree-programs/` and
> `.../academics/graduate-programs/list-of-graduate-programs/`, both plain
> HTML, no WAF, listing every program grouped by school/department with a
> real per-program link and the credential already in the name (e.g.
> "Bachelor of Science Aviation Management") — the same best-case shape
> UM's and Saint Leo's catalogs had. No PDF extraction needed after all.
> Verification, not assumption, caught a real dead link: the undergraduate
> page's own link for Aviation Management 404s (the file was evidently
> renamed on FMU's own server); the Department of Aviation and Safety's own
> "Degree Programs" subpage links the identical program at a different,
> live URL, confirmed with a real 200 before using it. One exclusion, the
> same "the other half of this program lives in an institution we don't
> have" shape that excluded STU's joint JD programs and Eckerd's Musical
> Theatre: "Bachelor of Science Biology + Nursing Dual Degree Program"
> awards a B.S. in Biology from FMU and a SEPARATE B.S. in Nursing from a
> partner institution (UM or FIU), confirmed by reading its own program
> sheet PDF — excluded since the FMU-side credential is already covered by
> the standalone Biology major. No new matcher gap. **Verified with a real
> live Gemini generation**: `/pathway?career=Accountant` under the `fmu`
> cookie returned a pathway whose steps matched the catalog verbatim
> (`"Bachelor of Science Finance"`, `"Master of Business Administration"`),
> each resolving to its real `fmu.edu` page.
>
> **JU** was the seventeenth private school and a dead end that was simply
> never re-surveyed past a subdomain guess: HANDOFF had logged "Jacksonville
> University has no `catalog.*`/`bulletin.*`/`*.smartcatalogiq.com`
> subdomain at all" — true as far as it went, but the real catalog was
> linked from JU's own site the whole time
> (`ju.edu/academics/academic-catalog.php` → `ju.catalog.prod.coursedog.com`),
> a platform never seen elsewhere in this project: Coursedog, a
> client-rendered Nuxt.js app (its own `window.__NUXT__` payload ships
> empty — all 199 program entries load client-side after mount, the same
> "read the rendered DOM" situation Ave Maria needed). `/programs` paginates
> 20-per-page with no URL page parameter, paged through by clicking each
> numbered button and re-reading the DOM, 10 pages total. Excluded the usual
> ~80 Minors and Certificates, plus several shapes confirmed by opening
> individual program pages rather than guessed from the name: two
> "Joint BS/MA in Marine Science" program-code variants (an accelerated
> 5-year track combining two ALREADY-separately-listed standalone
> credentials, the same redundant-combo shape as Ave Maria's 3+2 and FMU's
> dual-degree); every "X & Y" combo entry (Master in Public Policy paired
> with a JD, an MBA, or a Marine Science master's; MS Applied Business
> Analytics paired with an MBA or Organizational Leadership master's; MS in
> Nursing paired with an MBA) — one of these states outright that it
> "partners with any ABA accredited law school," the same "the other half
> lives in an institution we don't have" shape that excluded STU's joint JD
> programs, and the rest are purely internal JU combos whose components are
> all separately real entries already; and "Fellowship in Orthodontics," a
> one-year post-doctoral research fellowship, not a degree. Kept several
> similar-looking pairs after confirming on their own pages that they're
> genuinely distinct, separately-coded programs, not duplicates: the two
> Accelerated BSN programs and Accelerated MSN (real second-degree/
> direct-entry pathways, not the same code as the standard BSN/MSN); the
> several RN-to-BSN/RN-to-MSN bridge entries; "Master of Science in Marine
> Science" vs. "...Marine Studies" (different program codes, not a typo);
> and the two "Certificate/Master of Science in Dentistry" entries (Oral
> Implantology, Orthodontics), whose actual terminal credential is the
> stated M.S. despite "Certificate" leading the name. No new matcher gap —
> the round-trip test passed clean on the first try. **Verified with a real
> live Gemini generation**: `/pathway?career=Accountant` under the `ju`
> cookie returned a pathway whose steps matched the catalog verbatim
> (`"BBA Accounting"`, `"Master of Business Admin w Accounting & Finance"`),
> each resolving to its real `ju.catalog.prod.coursedog.com` per-program
> page.
>
> **Keiser** was the eighteenth private school and another dead end that
> was just an incomplete first look: HANDOFF had logged Keiser's
> `*.smartcatalogiq.com` subdomain as reserved-but-empty (true) and stopped
> there. Keiser's own site links its real PDF-only catalog from
> `keiseruniversity.edu/catalog/` (the same PDF-only shape STU/FMU/Eckerd
> needed `pdf-parse` for) — but the site's own top nav also links a
> "Program Directory" page (`keiseruniversity.edu/program-directory/`) that
> turned out to be the best single source in this whole project: one plain
> HTML page (no WAF, curl works), listing literally every program Keiser
> offers grouped by degree level, each a real per-program link with its
> credential and CIP code already in the name (e.g. "Accounting, AA
> 52.0301" — the CIP suffix stripped before use here, a classification code
> for institutional reporting, not something a pathway would ever name).
> Keiser is genuinely different from every other school in this batch: it's
> the one private university that actually grants Associate degrees as a
> normal, heavily-used credential, not a rare exception, so its catalog
> carries real `level: "associate"` entries too — it's still wired into
> `UNIVERSITY_PROGRAMS`/`universitySystemPrompt` like every other school
> here, so a generated pathway still starts at the bachelor's. Excluded
> throughout: every Spanish-language program name (confirmed each is the
> exact same CIP code and level as an English-named sibling already
> catalogued — this app only ever generates English pathways, so the
> Spanish name would never be a possible match for any query), Graduate
> Certificates and the one undergraduate Certificate, and one true
> duplicate link ("Psychology, MS (Mandarin)" points at the identical URL
> as plain "Psychology, MS," confirmed directly — unlike every other
> Mandarin-track entry, which each have their own distinct page). **The
> round-trip test caught a real, new matcher gap**: "Biomedical Sciences
> (BMT, Pre-Med), BS" and "Interdisciplinary Studies, Pre-DPT Bridge, BS"
> are both entirely bachelor's-level, but "Pre-Med" and "Pre-DPT" name the
> graduate program a student is preparing to apply to next, not this
> program's own level — bare `dpt` is a real `GRADUATE_HINT` token, and
> "Med" is caught by the dot-tolerant `m.?ed.?` (Master of Education) token,
> both outranking the "BS" right next to them. Fixed with a new
> `PRE_PROFESSIONAL_TRACK` strip in `programCatalog.ts`
> (`/\bpre-?(med|dpt)\b/gi`), the same "a degree code names something other
> than this program's level" shape as `BA_JD_PATHWAY`. **Verified with a
> real live Gemini generation**: `/pathway?career=Accountant` under the
> `keiser` cookie returned a pathway whose steps matched the catalog
> verbatim (`"Accounting, BA"`, `"Accountancy, MAcc"`), each resolving to
> its real `keiseruniversity.edu` per-program page.
>
> **FSC** was the nineteenth private school and yet another dead end that
> was accurate but incomplete: `*.smartcatalogiq.com` really is empty for
> Florida Southern, and FSC's own "Academic Catalog" page
> (`flsouthern.edu/academic-life/academic-catalog`) is a dead end too — a
> bare bullet list of section names ("Undergraduate Programs," "Graduate
> Programs," etc.) with no real links behind any of them, evidently a stub
> for the same abandoned SmartCatalogIQ instance. The real source is a
> different page again: `flsouthern.edu/academic-life/all-academic-
> programs` lists every major grouped by school, each a real marketing-
> style per-program page (no WAF, curl works). Every one of those ~100
> pages states its own credential(s) under a literal "AVAILABLE IN:"
> heading (e.g. Communication: "BA, BS, Minor") — read directly off every
> page (fetched locally in bulk, not assumed from a pattern), which is how
> this batch confirmed many FSC majors genuinely offer two credentials
> (mostly BA+BS, a few BA+BFA), each kept as two entries sharing one URL,
> the same shape as Ave Maria's Biology BA/BS. A handful of single-
> credential programs (Architecture, several Theatre Arts and Music tracks,
> and every adult/graduate/doctoral program) have no "AVAILABLE IN" widget
> at all — for those the one real credential is stated in the page's own
> prose instead (e.g. Architecture: "The BArch program..."), confirmed by
> reading the actual text. One exclusion matching this project's "not a
> standalone credential" shape: "Secondary Education (6-12)" names no
> credential of its own anywhere — it's a hub page describing a
> certification track layered onto OTHER majors' own degrees (Biology's own
> page separately states "Secondary Education Certification available for
> this major"), not a major in itself. Two more exclusions, the same "the
> other half of this program lives somewhere we don't have" shape that
> excluded STU's joint JD programs: "4+1 MBA Florida Polytechnic Agreement"
> (a dual-institution program with Florida Polytechnic) and "Early or 4+1
> MAcc" (a redundant accelerated track built on the already-separately-
> listed standalone Master of Accountancy). No new matcher gap. **Verified
> with a real live Gemini generation**: `/pathway?career=Accountant` under
> the `fsc` cookie returned a pathway whose steps matched the catalog
> verbatim (`"Accounting"` credentialed BS, `"Master of Accountancy"`),
> each resolving to its real `flsouthern.edu` per-program page under the
> correct School of Business and Free Enterprise area.
>
> **NSU** was the twentieth private school and the largest, messiest catalog
> in this whole project — a research university with 12 colleges including
> seven healthcare-related professional schools. `catalog.nova.edu` is
> confirmed still a **CourseLeaf placeholder ("A New Courseleaf Site Coming
> Soon!")**, matching this doc's existing note. The real source is a
> completely different page: `nova.edu/degrees.html`, a "Degree Finder"
> listing all 297 raw entries on one page (no WAF, curl works), each with a
> real per-program link and its credential already embedded in the name
> (e.g. "Biology (B.S.)"). Its own data has real quality problems that
> needed individual live-page verification rather than blind pattern-
> matching: two internal CMS-training links masquerading as real programs
> (`Accounting (B.S.B.A.)` and a bare "Training Program" both pointed at
> `nova.edu/prmc/secure/cms-training/...`); five dead `_archive`-path links
> (four discontinued "B.S. Secondary ___ Education" programs, confirmed
> 404, plus a stale "MBA in Finance" duplicate whose archive page is
> actually titled "M.B.A. in Accounting"); a duplicate "MBA in Marketing"
> link that silently falls back to the generic Business Master's landing
> page; and a "Ph.D. in Criminal Justice" duplicate linking to a generic
> Master's hub instead of any doctoral page. All excluded in favor of the
> correctly-linked entry. Kept despite looking similar at first glance:
> "Nursing (B.S.N. to D.N.P.)" and "Nursing (D.N.P. to Ph.D.)" are real
> bridge programs with their own distinct pages (the same shape as JU's
> BSN-to-DNP tracks), and "Dental Science (M.D.S.)" is kept even though its
> URL lives under a `/certificate/` path — its own page confirms the real
> terminal credential is a genuine Master of Dental Science (the same
> "trust the real credential, not the URL segment" call JU's Dentistry
> Certificate/M.S. entries needed). Standard exclusions: Minors, Certificates,
> "3+1 Pathway Programs" (accelerated-track hub pages), all ~38 "Dual
> Admission" entries (redundant advising tracks for programs already
> separately listed), and "Educational Leadership (B.S. to Ed.D.)" (a
> redundant bridge onto the already-listed standalone Ed.D.). Final count:
> 176 programs (48 bachelor's, 128 graduate). NSU's own dotted-credential
> style (`M.Acc.`, `Ed.S.`, `J.D.`, `M.B.S.`, `D.N.P.`, all with a literal
> `.` after every letter) surfaced **five real `GRADUATE_HINT` gaps** in the
> round-trip test — `macc`, `jd`, and `dnp` previously only matched their
> undotted forms, and `Ed.S.` and `M.B.S.` had no graduate code at all —
> each collapsing onto a same-named bachelor's (e.g. `Nursing (D.N.P.)` onto
> `Nursing (Accelerated B.S.)`) until fixed by adding dot-tolerant
> `ed\.?s\.?`, `m\.?b\.?s\.?`, `j\.?d\.?`, and `d\.?n\.?p\.?` alongside the
> existing bare codes, plus extending `macc` to `m\.?a\.?c\.?c\.?`, in
> `programCatalog.ts`. **Verified with a real live Gemini generation**:
> `/pathway?career=Accountant` under the `nova` cookie returned a pathway
> whose steps matched the catalog verbatim (`"Accounting (B.S.B.A.)"` →
> `"Public Accounting (M.Acc.)"`), each resolving to its real
> `business.nova.edu` per-program page.
>
> **EWU** was the twenty-first and last private school — and, unusually for
> this batch, the easiest catalog by far. `<school>.smartcatalogiq.com`
> really does return "Layout Not Found" on every path tried, confirmed
> distinct from Barry's and UT's working instances — a genuine dead end,
> matching the doc's existing note. Guessing `catalog.ewu.edu` is a trap,
> not just a miss: it returns a real, live, 200-OK CourseLeaf catalog — for
> **Eastern Washington University**, an entirely different school on the
> other side of the country that happens to share the "EWU" short name.
> Confirmed only by reading the page's own `<title>`, not the HTTP status.
> Edward Waters's own domain is `ew.edu` (found via `ewc.edu`, its former
> abbreviation-based domain, which 301-redirects there). The real source is
> `ew.edu/academic-programs/`, a small, current, actively-maintained page
> (July 2026 image uploads) listing every program with its own real
> per-program link, no WAF, curl works, every page's `<title>` confirmed to
> match its listed name exactly — the school's own current-year PDF catalog
> link 404s (broken/stale), so the live web listing is the source of truth,
> not the PDF. One exclusion: "General Studies" is listed in the site's own
> nav menu alongside the real majors, but its own page states it is "the
> core of the undergraduate curriculum for all students, regardless of
> their major" — a foundational program, not a credential of its own, the
> same "names no credential of its own" shape that excluded FSC's
> "Secondary Education (6-12)" hub page. Business Administration's four
> internal concentrations (Business Management, Computer Information
> Systems, Healthcare Management, Organizational Management) are tracks
> within the one B.S., not separate majors. EWU spells out every credential
> in full ("Bachelor of Science in Accounting," "Master of Business
> Administration") rather than abbreviating — the one same-named collision
> this creates (Business Administration at both levels) resolved correctly
> with no new matcher gap, since `requestedLevel()` already recognizes the
> bare spelled-out words "bachelor" and "master." Final count: 15 programs
> (11 bachelor's, 4 graduate). **Verified with a real live Gemini
> generation**: `/pathway?career=Accountant` under the `ewu` cookie returned
> a pathway whose steps matched the catalog verbatim ("Bachelor of Science
> in Accounting" → "Master of Business Administration"), each resolving to
> its real `ew.edu` per-program page.
>
> **All 61 Florida schools are now catalogued. This closes out the
> catalog-building project** described in §13 below — there is no more
> "next school" work left. What remains is maintenance: schools add, retire,
> or rename programs over time, and the `programCatalogs` round-trip test
> (§13, "the standing warning") will keep catching the one recurring failure
> mode — a new credential code colliding with an existing `GRADUATE_HINT`/
> `BACHELOR_HINT` token — whenever a catalog file gets refreshed.

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

**All 61 of 61 schools can generate pathways** — all 27 state colleges, all
12 SUS public universities (FIU + UCF + UF + FGCU + UWF + NCF + UNF +
FlPoly + USF + FAU + FAMU + FSU), and all 21 private universities (UM,
Stetson, ERAU, UT, Barry, Lynn, Rollins, Flagler, PBA, FIT, Saint Leo, STU,
Ave Maria, Bethune-Cookman, Eckerd, FMU, JU, Keiser, FSC, NSU, EWU). The
catalog-building project (§13) is complete; what's left is maintenance as
schools change their own offerings over time.

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
    transferAgreements.ts     27 flagship articulation agreements (§7).

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
- **`universityId` points at the partner's own catalog, and that closes the last
  free-generation hole.** Naming the partner in prose still left the *degree*
  unnamed: the bachelor's a student transfers INTO was the one step in the whole
  app the model could invent, and it's the step the pathway is aiming at. Each
  agreement now carries the partner's catalog id, so `transferPartnerSection`
  embeds that university's real bachelor's list ("the transfer bachelor's must
  be one of these, named EXACTLY") and `ProgramLink` resolves the post-transfer
  step against the partner's catalog to render "Offered at FIU: Accounting
  (BACC)" with a link to the real page. A test asserts every `universityId`
  resolves to a catalog we hold, and that **`gcsc` is the only agreement without
  one** — its partner is FSU's *Panama City* branch, whose degree list is much
  narrower than the main-campus catalog we hold under `fsu`, so pointing it
  there would offer programs Panama City doesn't teach. It stays prose-only.
- **MDC is in this table too, not a special case anymore.** MDC predates
  `transferAgreements.ts` — its own prompt and `ProgramLink` used to hardcode
  FIU as the transfer destination directly (`findFIUProgram`, imported only for
  MDC's benefit). MDC's own transfer page names three guaranteed-admission
  programs (FIU Connect4Success, FAU LINK, UCF Transfer Connect) with no
  explicit "flagship" label, but FIU's is the one that singles MDC out by
  name — FIU's own C4S page calls MDC a "longtime partner," and FIU's Bridge
  Advisors are housed at only three colleges statewide, MDC listed first —
  so `mdc: { universityId: "fiu", ... }` is now a normal table entry like
  every other school's, `mdcSystemPrompt`/`mdcUserQuery` call the same
  `transferPartnerSection`/`transferAgreementFor` helpers, and `ProgramLink`'s
  MDC branch falls through to the same `transferPartnerLink` helper the
  colleges use — same FIU destination, same "Offered at FIU: Accounting
  (BACC)" output, now driven by data instead of a hardcoded import.
- **A real bug this generalization surfaced: 9 colleges' own bachelor's
  programs share a bare name with their partner's.** Diffing every college's
  own bachelor list against its partner's found real overlaps — Santa Fe
  College and UF both grant an "Accounting" bachelor's; TSC/FSU, IRSC/FAU,
  FSW/FGCU, PSC/UWF, SPC/USF, NWFSC/UWF, FSCJ/UNF, and FGC/UF each collide on
  at least one subject (mostly "Nursing," also "Elementary Education,"
  "Business Administration," "Cybersecurity," "Biology," "Criminal Justice,"
  "Biomedical Sciences"). Confirmed live: a Santa Fe → Accountant pathway's
  post-transfer "Accounting" bachelor's step resolved to Santa Fe's OWN
  Accounting page instead of UF's, because `catalogFor("sf").find()` tried
  (and matched) the school's own catalog first with no way to know the step
  was meant for the partner. Fixed in `resolveProgramLink.ts` (ProgramLink.tsx
  is now a thin renderer around it — extracted so this bug has a real unit
  test, since this repo's vitest config runs Node, not jsdom, and there was no
  component-test setup to render `ProgramLink` directly) with two signals,
  tried in order: **`afterTransfer`** — whether a transfer step precedes this
  one in the SAME pathway, computed by the caller (`app/pathway/page.tsx`)
  from the full steps array, the reliable structural signal — and, as a
  fallback, whether the model tagged the step's own `level` with the
  partner's name ("B.S. (UF)"), the convention `collegeSystemPrompt`/
  `mdcSystemPrompt` teach it. Either one makes `ProgramLink` try the partner's
  catalog BEFORE the school's own, so the same-named local program can't
  shadow it. `resolveProgramLink.test.ts` covers both signals plus the
  ordinary "no partner signal, resolve to the school's own program" default.

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

## 12. Test suite — 649 tests, 21 files

| Area | Files | Notable coverage |
|---|---|---|
| Catalogs | `programCatalogs`, `fiu-programs`, `programs/broward`, `mdc-programs`, `fiuCoverage` | Every program round-trips to itself at the right level; no tracking params; coverage floor |
| Generation | `pathwayPrompts` (177 tests), route tests | Per-school: own catalog embedded, own transfer partner named, no other school's catalog leaked, no un-interpolated `${` |
| Transfers | `transferAgreements`, `resolveProgramLink` | Every agreement has a real school, a live `.edu` link, and a non-stub summary; every `universityId` resolves to a catalog we hold; Chipola stays `null`, GCSC is the only agreement without a partner catalog; a same-named school/partner program (e.g. Santa Fe's and UF's "Accounting") resolves to whichever one the step was actually taken at |
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

## 13. Private universities — done (21 of 21). The catalog-building project is complete.

**Status as of 2026-07-30:** all 27 Florida College System schools, all 12
SUS public universities, AND all 21 private (SACSCOC) universities are wired
up and generating pathways. Publics: FIU (original), UCF (the pilot that
validated the university template), UF, FGCU, UWF, NCF, UNF, FlPoly, USF,
FAU, FAMU, and FSU. Privates: University of Miami, Stetson University,
Embry-Riddle Aeronautical University (Daytona Beach), University of Tampa,
Barry University, Lynn University, Rollins College, Flagler College, Palm
Beach Atlantic University, Florida Institute of Technology, Saint Leo
University, St. Thomas University, Ave Maria University, Bethune-Cookman
University, Eckerd College, Florida Memorial University, Jacksonville
University, Keiser University, Florida Southern College, Nova Southeastern
University, and Edward Waters University — all done, using the same
`universitySystemPrompt` template unchanged. Nothing remains:

| Group | Count | Catalogued | Notes |
|---|---|---|---|
| State colleges | 29* | 27 | Done. (*29 includes MDC + Broward) |
| SUS public universities | 12 | 12 (all of them) | Done. |
| Private (SACSCOC) | 21 | 21 (all of them: UM, Stetson, ERAU, UT, Barry, Lynn, Rollins, Flagler, PBA, FIT, Saint Leo, STU, Ave Maria, Bethune-Cookman, Eckerd, FMU, JU, Keiser, FSC, NSU, EWU) | Done. All 61 Florida schools now have real catalogs. |

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

### Private universities — 21 of 21 done

All 21 are SACSCOC-accredited private (non-state) schools. Full list, from
`floridaSchools.ts` (id — name — city). All 21 are done:

| id | Name | City |
|---|---|---|
| `avemaria` | Ave Maria University | Ave Maria | ✅ Done — see below |
| `barry` | Barry University | Miami Shores | ✅ Done — see below |
| `cookman` | Bethune-Cookman University | Daytona Beach | ✅ Done — see below |
| `eckerd` | Eckerd College | St. Petersburg | ✅ Done — see below |
| `ewu` | Edward Waters University | Jacksonville | ✅ Done — see below |
| `erau` | Embry-Riddle Aeronautical University | Daytona Beach | ✅ Done — see below |
| `flagler` | Flagler College | St. Augustine | ✅ Done — see below |
| `fit` | Florida Institute of Technology | Melbourne | ✅ Done — see below |
| `fmu` | Florida Memorial University | Miami Gardens | ✅ Done — see below |
| `fsc` | Florida Southern College | Lakeland | ✅ Done — see below |
| `ju` | Jacksonville University | Jacksonville | ✅ Done — see below |
| `keiser` | Keiser University | Fort Lauderdale | ✅ Done — see below |
| `lynn` | Lynn University | Boca Raton | ✅ Done — see below |
| `nova` | Nova Southeastern University | Davie | ✅ Done — see below |
| `pba` | Palm Beach Atlantic University | West Palm Beach | ✅ Done — see below |
| `rollins` | Rollins College | Winter Park | ✅ Done — see below |
| `saintleo` | Saint Leo University | St. Leo | ✅ Done — see below |
| `stu` | St. Thomas University | Miami Gardens | ✅ Done — see below |
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

**What Rollins confirmed.** Acalog behind AWS WAF Bot Control, the same
platform/symptom pair as FAMU/FlPoly/USF in the SUS batch: `catalog.rollins.edu`
returns HTTP 202 with `x-amzn-waf-action: challenge` on both `content.php`
and `preview_program.php` for `curl`/`fetch()` alike, while `index.php` (the
catalog picker) loads fine and a real browser's top-level navigation gets
through every page tried — the clearest confirmation yet that the
FlPoly/USF browser-navigation workaround generalizes to any WAF-blocked
Acalog school, not just those two. Rollins is also the first private school
to publish **four** separate catalogs rather than the usual undergrad+grad
pair: College of Liberal Arts (traditional day undergrad, catoid=35, 37
majors), Hamilton Holt Undergraduate (adult/evening undergrad, catoid=36, 13
majors), Hamilton Holt Graduate (catoid=37, 8 real degrees), and Crummer
Graduate School of Business (catoid=38, 4 MBA delivery tracks: Early
Advantage, Executive, Professional, Accelerated/STEM). Hamilton Holt
Undergraduate was excluded outright: 7 of its 13 majors share an exact
subject name with a College of Liberal Arts major (Business Management,
Communication Studies, Economics, Education - Elementary Education,
Self-Designed, Music, Psychology) but a different poid/URL and even a
different stated credential (Holt's Degree Requirements page says generic
"Bachelor of Arts"; CLA's states its own "Artium Baccalaureus (A.B.)") —
merging both would put two same-named bachelor's entries in one bucket with
no way for a query to pick the right physical page, since
`createProgramCatalog`'s `find()` just returns whichever was pushed first
when both match the preferred level. College of Liberal Arts was kept as
the sole bachelor's catalog (larger, and the flagship day program a
prospective undergraduate actually enrolls in) — the same "pick the one
division that matches the school's normal meaning" call ERAU's batch made
among its several campuses. Every College of Liberal Arts major confers the
same credential regardless of subject ("A.B.", confirmed on its own Degree
Requirements page) — the same one-degree-many-majors shape as NCF's B.A.
"Social Innovation" was excluded as a real, site-stated dead program (its
own page: "will be discontinued effective Fall 2024... New declarations of
the SI major will cease effective Fall 2023") — the same call as UF's
Religion program and FAU's suspended majors. "Professional Training Option"
and three teacher-certification/endorsement "Sequences" were excluded after
each one's own page confirmed it rides alongside an already-listed M.A.T.
rather than being its own degree. All 49 final poids were cross-checked
against a fresh DOM re-extraction right before shipping — curl-based bulk
URL verification doesn't work on this domain either, the same finding as
Lynn's — and came back with zero discrepancies. Zero round-trip mismatches
on the first pass, despite "A.B." being a credential shape with no
precedent elsewhere in the batch: `BACHELOR_HINT`'s `b\.?a\.?` alternative
requires a "b" before an "a", so it does not match Rollins' letters-reversed
"A.B." at all. It happened not to matter here — no Rollins program shares a
name across two levels, so `find()` never needed the hint — but this is a
real latent gap, not a fixed one; a future "A.B." school whose credential
does collide by name with a graduate entry will need a new `BACHELOR_HINT`
alternative (`a\.?b\.?`) the same way every other credential-shape gap in
this project has been fixed: only once the round-trip test actually shows
the collision, never guessed ahead of it. **Verified with a real live
Gemini generation**: `/pathway?career=Accountant` under the `rollins`
cookie returned two pathways whose every degree-step name matched the
catalog verbatim (`"Business Management (A.B.)"`, `"Early Advantage MBA
(M.B.A.)"`, `"Economics (A.B.)"`), each resolving to its real
`catalog.rollins.edu` page.

**What Flagler confirmed.** Also Acalog behind AWS WAF Bot Control, same
HTTP 202 + `x-amzn-waf-action: challenge` on both `content.php` and
`preview_program.php` for `curl`/`fetch()`, same clean top-level-navigation
bypass — the second confirmation (after Rollins) that the FlPoly/USF
technique generalizes to any WAF-blocked Acalog school, not just the two it
was discovered on. Flagler has its own built-in Acalog "Programs of Study
(A-Z)" widget (`content.php?catoid=13&navoid=355`) — the exact shape
Barry's catalog used — listing all 98 Program entities (majors, minors,
certificates, endorsements, graduate) on one page; **check for this widget
on every future Acalog school before assuming a sitemap or per-page crawl
is needed.** Independently cross-checked against Flagler's own marketing
site (`www.flagler.edu/academics/degrees-programs`, a Drupal Views table
with the same Major/Minor/Graduate/Certificate flags), which states "42
majors leading to a bachelor's degree, two master's degree programs" —
matching this catalog's final count exactly. Unlike Rollins/NCF's
one-degree-for-every-major shape, Flagler's own "Degree Requirements" page
states it confers three different bachelor's credentials (B.A., B.S.,
B.F.A.) depending on the major, so all 42 majors needed their own
credential hand-checked on their own program page — most state it in
prose ("will earn a Bachelor of Science degree"), a few state it inline
instead (History's page reads "The History major (BA) consists of..."),
and the actual letter was never guessable from the subject alone (Business
Administration → B.A., but Finance and Accounting → B.S.). Two subjects
(Fine Arts, Graphic Design) each turned out to offer both a standard major
and a separate, more intensive BFA track as two distinct real programs with
their own pages — confirmed by reading both rather than assuming a
duplicate-listing scraping error, and kept as two distinct catalog entries
to avoid collapsing a real option or colliding two same-named bachelor's
entries in one lookup bucket. Flagler's own site abbreviates "Master of
Public Administration" as "MPA" (undotted) — already covered by
`GRADUATE_HINT`'s existing bare `mpa` code, no new matcher code needed. All
44 final poids were cross-checked against a fresh DOM re-extraction right
before shipping (curl-based bulk verification doesn't work on this domain
either) with zero discrepancies, and zero round-trip mismatches. **Verified
with a real live Gemini generation**: `/pathway?career=Accountant` under
the `flagler` cookie returned three pathways whose every degree-step name
matched the catalog verbatim (`"Accounting (B.S.)"`, `"Finance (B.S.)"`,
`"Business Administration (B.A.)"`), each resolving to its real
`catalog.flagler.edu` page.

**What PBA confirmed.** Also Acalog behind AWS WAF Bot Control, same HTTP
202 + `x-amzn-waf-action: challenge`, same clean top-level-navigation
bypass — the third straight confirmation this generalizes to any
WAF-blocked Acalog school. Its own built-in "Programs of Study" widget
exists on **both** halves of its two-catalog split (`catoid=55`
undergraduate, `catoid=56` graduate), each grouped by real degree type with
the credential already in the title — and, a first for this batch, Acalog's
own listing carries a literal "Discontinued Programs" group, so excluding
dead programs took zero per-page checking this time (every prior school
required reading each program's own page to learn it had been
discontinued). At 136 real programs (91 bachelor, 45 graduate) it's the
largest catalog in the batch by a wide margin — nearly double Barry's 84.
One exclusion needed its own page read: "Business Administration, B.A."
states "may only be taken as a student's second major," so it has no valid
slot in a pathway that always starts with exactly one (first and only)
bachelor's program; "Business Administration, B.S." remains as the real
standalone option. Two "3+2" combined bachelor's-to-master's programs
turned out to be filed as separate real Program entities on BOTH sides of
the undergrad/grad split — same pipeline, two different poids, two
different URLs — and keeping both would have shipped duplicate same-name
same-level entries `find()` could only resolve arbitrarily; kept whichever
side matches how the matcher would classify the name (graduate-side for the
two literally named "Master of..."; undergraduate-side for the third, whose
own page frames its output as "a bachelor's degree in business"). **The
round-trip test caught a real, new matcher gap, the same as every prior
university in this batch**: "Biology: Concentration in Graduate School
Preparation, B.S." resolved to nothing because `GRADUATE_HINT`'s bare
`graduate` token matched "Graduate" inside "Graduate School" — a
concentration preparing a student *for* grad school later, not a
graduate-level program. Fixed with a new `GRADUATE_SCHOOL_PHRASE` strip in
`programCatalog.ts`, stripped before the level checks run — the same "a
real word means something else in context" shape as the existing
`GRADUATE_OF_A_DEGREE` strip for Broward's "AA Graduate." All 134 poids
(plus 2 content.php links for base degrees with no Program entity of their
own) were cross-checked against a fresh DOM re-extraction with zero
discrepancies. **Verified with a real live Gemini generation**:
`/pathway?career=Accountant` under the `pba` cookie returned two pathways
whose every degree-step name matched the catalog verbatim (`"Accounting,
B.S."`, `"Master of Accountancy"`, `"Finance, B.S."`, `"Master of
Accountancy and Analytics"`), each resolving to its real `catalog.pba.edu`
page.

**What FIT confirmed.** Also Acalog behind AWS WAF Bot Control, same HTTP
202 + `x-amzn-waf-action: challenge`, same clean top-level-navigation
bypass — the fourth straight confirmation this generalizes to any
WAF-blocked Acalog school. Unlike Rollins/PBA, FIT runs a single combined
catalog (not split by undergrad/grad) with one comprehensive "Degree
Programs" page (`content.php?catoid=20&navoid=1245`) listing all 217 raw
entries grouped by College/Department and then by Undergraduate/Graduate —
the same one-page-has-everything shape UM's and UNF's catalogs had. Every
entry already states its own credential in the title, so no separate
`credential` field was needed anywhere in this file. 11 real Associate-level
entries (A.A./A.S.) were mixed into the undergraduate subsections and
excluded, the same call ERAU's/UCF's/Barry's scrapers made for their own
associate tracks. Being STEM/aviation-heavy, several subjects (Aviation
Management, Aeronautical Science, Aviation Meteorology, Aviation Human
Factors & Safety, Aviation Administration) offer both a standard and a
"- Flight" track as two distinct real bachelor's programs, and Aviation
Management additionally splits into a B.A. and a B.S. — all kept as
separate entries since each is real, differently named, and separately
admitted. "Doctor of Aviation, Av.D." is a credential code with no
precedent anywhere in this project, but its own full name already contains
the bare word "Doctor," so `GRADUATE_HINT` reads it correctly with no new
code needed. "STEM Education, Ed.S." uses an Ed.S. (Education Specialist)
code `GRADUATE_HINT` doesn't recognize at all (it only covers `ed.d.`) — a
real, confirmed gap, left unfixed because nothing in this catalog collides
by name with it, so the round-trip test had nothing to fail on; add an
`eds` code only once a future school's data actually proves the gap
matters. Zero round-trip mismatches on the first pass otherwise. All 155
final poids were cross-checked against a fresh DOM re-extraction right
before shipping, with zero discrepancies. **Verified with a real live
Gemini generation**: `/pathway?career=Aerospace Engineer` under the `fit`
cookie returned two pathways whose every degree-step name matched the
catalog verbatim (`"Aerospace Engineering, B.S."`, `"Aerospace Engineering,
M.S."`, `"Mechanical Engineering, B.S."`), each resolving to its real
`catalog.fit.edu` page.

**What Saint Leo confirmed — and closed out.** `academiccatalog.saintleo.edu`
is Acalog behind AWS WAF Bot Control, the same HTTP 202 +
`x-amzn-waf-action: challenge` on both `content.php` and
`preview_program.php`, and the same clean top-level-navigation bypass.
**This was the fifth and last of the WAF-blocked Acalog schools this
project's survey ever identified (Rollins, Flagler, PBA, FIT, Saint Leo) —
the browser-navigation technique is now 5 for 5 against this exact
platform/symptom combination, with no exceptions found.** Saint Leo splits
into two catalogs like PBA/Rollins (`catoid=77` undergraduate, `catoid=76`
graduate), each with a single comprehensive page listing every program
grouped by college/department then degree type. One real duplicate needed
resolving: "Business Administration, B.A." is listed twice — once
"(Offered only at University Campus)", once "(Offered only through
Worldwide)" — two different poids for the literal same major name, which
`normalizeProgramName`'s parenthetical-stripping would otherwise collide
on; kept only the University Campus copy, the flagship on-campus program,
the same call Rollins's batch made between its College of Liberal Arts and
Hamilton Holt Undergraduate. One entry needed its name corrected, not just
transcribed: the graduate catalog's own anchor text for a Master of
Education concentration read only "Educational Leadership Concentration",
missing the parent-degree prefix every sibling entry in the same list had
— its own page confirmed the fuller name in prose ("The Master of
Education with a concentration in Educational Leadership"), so this file
renames it to "Master of Education: Educational Leadership Concentration"
to match its siblings, the same "trust the page's own fuller text over an
inconsistent anchor" call Stetson's scraper made. **This is the first
Acalog school in the entire private batch to pass the round-trip test with
zero matcher fixes needed on the first try** — every credential code here
(B.A., B.S., B.S.N., B.S.W., M.A., M.S., Ed.D., Ed.S., DBA, and several
"Doctor of..."/"Master of..." names spelled out in full) was already
covered by existing `GRADUATE_HINT`/`BACHELOR_HINT` patterns. All 83 final
poids were cross-checked against a fresh DOM re-extraction right before
shipping, with zero discrepancies. **Verified with a real live Gemini
generation**: `/pathway?career=Accountant` under the `saintleo` cookie
returned two pathways whose every degree-step name matched the catalog
verbatim (`"Accounting, B.S."`, `"Master of Science in Accounting"`,
`"Finance, B.S."`), each resolving to its real
`academiccatalog.saintleo.edu` page.

**What STU confirmed — a genuinely new extraction approach.** St. Thomas
has no HTML catalog at all: `stu.edu/academics/course-catalogs/` links
straight to two PDFs (undergraduate, 313 pages; graduate, 256 pages), no
WAF, plain WordPress hosting, `curl` works fine on the PDFs themselves.
This is the first (and, per the note below, no longer the only) school
this project solved with PDF text extraction rather than any HTML
scraping. The `pdf-parse` npm package was installed in a scratch directory
(never added to this project's `package.json`, per the "don't add a
dependency for something small" rule) and used to extract plain text
locally. Every program was found via its own real section heading in that
text (e.g. "BACHELOR OF ARTS (BA) IN ENGLISH", "MASTER OF ACCOUNTING
(MAC)"), then cross-checked page-by-page against the PDF's own table of
contents — every single entry matched but one, a TOC typo for "Master of
Accounting" whose stated page number even falls outside the TOC's own
stated range for that section, confirming the typo was in the source
document, not the extraction. Each program links to the PDF's own `#page=N`
fragment (a standard PDF convention every major browser's native viewer
honors) rather than one shared link to page 1 — confirmed accurate two
ways: `pdf-parse`'s own page array lines up exactly with the page-boundary
markers it inserts between extracted pages, with zero offset from the
PDF's own printed page numbers; and, after shipping, the live Gemini
pathway's own linked page was read back out of the downloaded PDF and
found to contain exactly the expected program header. Two exclusions
matching shapes already seen elsewhere in this batch: generic
"Specialization in X" tracks any business major can pair with (no
independent credential, confirmed by reading their own pages) were
excluded the same way Flagler's and PBA's generic add-on specializations
were; three Joint JD/graduate-degree programs were excluded because each
requires separate admission to STU's own School of Law, a professional
program with its own catalog this project doesn't cover — the same "the
other half of this combined program lives in a catalog we don't have"
reasoning that's kept a bare JD out of every school's catalog in this
project so far. **The round-trip test caught a real, new matcher gap, the
same as basically every school in this batch**: STU's four "BA-JD in X"
accelerated law-track programs (Political Science, Criminal Justice,
English, Psychology) are entirely bachelor's-level — the student enrolls
as a normal undergrad, and "JD" names the eventual destination the track
leads to, not this program's own level — but bare `jd` is a real
`GRADUATE_HINT` token, so it was outranking the "BA" right next to it and
resolving every one of the four to nothing. Fixed with a new
`BA_JD_PATHWAY` strip in `programCatalog.ts`
(`/\bba[\s/-]*jd\b/gi`), stripped before the level checks run — the same
"a degree code names something other than this program's level" shape as
the existing `DEGREE_TRANSITION` strip for UCF's "BS to MSEnvE." **Verified
with a real live Gemini generation**: `/pathway?career=Accountant` under
the `stu` cookie returned two pathways whose every degree-step name
matched the catalog verbatim (`"Bachelor of Business Administration (BBA)
in Accounting"`, `"Master of Accounting - Public Accounting
Specialization"`), each resolving to its real PDF page.

**What Ave Maria confirmed — the first client-rendered-SPA catalog.**
`catalog.avemaria.edu/programs` has no real per-program or per-department
URL at all: it's a Next.js single-page app whose program cards are
`<button>` elements, not links — clicking one (or its expand control) never
changes `location.href`, confirmed directly after each click — and the only
network traffic on that page is Next.js RSC/Server-Action calls (including
an auth-check POST returning `{"user":null,"role":null}`), never a JSON
endpoint carrying program data. Every program was read directly out of the
rendered DOM instead. The page's own "Majors (36) / Minors (38) /
Graduate (7)" tab badges disagree with what's actually rendered: the DOM was
confirmed NOT virtualized (`scrollHeight === clientHeight`, `overflow:
visible` on the card container, so nothing is lazy-loaded on scroll) and a
full extraction found exactly 38 Minor cards and 7 Graduate cards — both
matching their badges exactly — but only 33 Major cards, alphabetically
continuous with no gap from A to Z. That strongly suggests the "36" badge is
simply stale on Ave Maria's own site rather than a card this extraction
missed. Two of the 33 majors (Biology, Exercise Physiology) offer both a
B.A. and a B.S., bringing the real bachelor's-level count to 35 (rounded out
by 7 graduate programs: an MBA, two M.Ed. tracks, an MA in Communications,
an MA in Philosophy, and an MA plus a Ph.D. in Theology — 42 programs
total). Applied the FSU precedent: real program names, one shared link
(`https://catalog.avemaria.edu/programs`) rather than a fabricated
per-program URL — the same call FSU's scraper made for its own unscrapable
Power BI dashboard. No new matcher gap this time; the round-trip test
passed clean on the first try, the first school in this batch that didn't
need a new regex. **Verified with a real live Gemini generation**:
`/pathway?career=Accountant` under the `avemaria` cookie returned a pathway
whose degree steps matched the catalog verbatim (`"Accounting (BA)"`,
`"Business Administration (MBA)"`), each resolving to the real shared
catalog URL.

**What Bethune-Cookman confirmed — closed out a previously "unidentified"
mechanism.** An earlier survey pass logged `catalog.cookman.edu` as "not
WAF-blocked" because `index.php?catoid=41` returns a plain 200 under curl —
but `content.php` and `preview_program.php` (the pages that actually carry
program data) return HTTP 202 with `x-amzn-waf-action: challenge`, confirmed
directly. It's Acalog behind AWS WAF Bot Control after all, the same
platform and symptom as Rollins/Flagler/PBA/FIT/Saint Leo, and the same
browser-navigation bypass got through cleanly — there was no separate
"unidentified nav-tree mechanism" to find, just an incomplete first look.
Both catalogs (undergraduate `catoid=51`, graduate `catoid=55`) have one
comprehensive "Academic Programs" page listing every major, minor,
certificate, and non-degree program, each with a real
`preview_program.php?catoid=&poid=` link — the same best-case shape UM's
and Saint Leo's catalogs had. (The older "Degree Offerings" page is stale —
missing several newer majors like Actuarial Science and Cybersecurity — so
the current "Academic Programs" page was used instead.) Undergraduate titles
already state their own credential ("Accounting, B.S."), so no separate
`credential` field was needed there, the same "name already carries the
code" shape Saint Leo's and STU's files use; graduate titles were
inconsistent about it (some inline, like "(MBA)"; "Master in Health Equity"
and "Master of Athletic Training" state none at all), so graduate entries
carry a `credential` field read off each program's own page instead — Health
Equity's own page states "Master of Public Health in Health Equity (MPH)";
Athletic Training states no abbreviation anywhere, spelled out as "Master's"
the same way FSU/NCF handled their own unlabeled graduate programs.
Excluded: all 30 minors, all 5 certificates (3 undergraduate, 2 graduate),
two non-degree Air Force ROTC entries, and "Integrated Environmental Science
3+2 (B.S./M.S.)" — an accelerated track combining two already-separately-
listed standalone degrees (the B.S. major and the M.S.) under one name with
no single level to assign it without guessing. `area` was left off
entirely: the catalog's four colleges each have their own page, but none
enumerate their majors in scrapable form, just mission/vision prose naming a
handful in passing — guessing the rest by subject would invent an
administrative grouping rather than read a real one back. No new matcher
gap this time. **Verified with a real live Gemini generation**:
`/pathway?career=Accountant` under the `cookman` cookie returned a pathway
whose degree steps matched the catalog verbatim ("Accounting, B.S.",
"Master of Business Administration"), each resolving to its real
`catalog.cookman.edu` per-program page.

**More dead ends surveyed, not yet resolved:**
- **Florida Memorial University's catalog is PDF-only**
  (`fmu.edu/academics/catalogs-courses/`, no HTML catalog page at all) — the
  same obstacle St. Thomas had, now a solved problem rather than an open
  question. Extract text locally with `pdf-parse` (installed in a scratch
  dir, never added to `package.json`), find each program's own section
  heading, cross-check every page number against the PDF's own table of
  contents, and link with `#page=N` rather than a single shared URL — see
  STU's writeup above for the full method and the one real gotcha it found
  (TOC page numbers can have their own typos; trust the page-marker-derived
  value when they conflict with the TOC's own stated section range).
- **Eckerd College has real per-major pages but none of them state a
  credential.** `eckerd.edu/academics/majors/` lists ~41 real majors with
  real per-major links (e.g. `eckerd.edu/biology/`), but neither that page,
  the individual major pages, nor the general academics pages mention
  "Bachelor" anywhere — confirmed by a text search across several pages.
  Eckerd's own PDF catalog almost certainly states the credential per major,
  but the per-major HTML pages don't, and guessing whether a given major is
  B.A. or B.S. would violate "never invent school data." Needs either PDF
  extraction or a source that states credentials, neither found yet.
- **Jacksonville University has no `catalog.*`/`bulletin.*`/
  `*.smartcatalogiq.com` subdomain at all** (403 from CloudFront/S3 on the
  SmartCatalogIQ guess) — needs a full fresh platform survey from scratch.
  (Resolved — see JU's writeup above — kept here as a platform-survey
  example.)

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
