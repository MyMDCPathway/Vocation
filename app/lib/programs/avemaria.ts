// Ave Maria University degree catalog: program name -> the one page that
// lists it.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school,
// and it is a genuinely different shape than every other school in this
// project: catalog.avemaria.edu/programs is a client-rendered Next.js SPA.
// There are no per-program URLs at all — clicking a program card expands it
// in place without changing window.location.href (confirmed by watching the
// URL across a click), and the network tab shows only Next.js RSC/Server-
// Action traffic (an auth-check POST to /programs returning
// {"user":null,"role":null}), never a JSON endpoint carrying program data.
// curl/fetch see none of this — it only exists after client JS runs — so
// every program below was read directly out of the rendered DOM.
//
// Same call as FSU (see fsu.ts and HANDOFF.md §13): one shared, always-
// correct link beats a guessed or fabricated per-program URL, so every entry
// points at https://catalog.avemaria.edu/programs itself.
//
// The page's own "Majors (36) / Minors (38) / Graduate (7)" tab counters
// don't match what's actually rendered: the DOM was confirmed NOT virtualized
// (container scrollHeight === clientHeight, overflow: visible — everything
// is present in the DOM at once, nothing lazy-loads on scroll), and a full
// extraction found exactly 38 Minor cards and 7 Graduate cards (both matching
// their tab labels) but only 33 Major cards, alphabetically continuous
// A-through-Z with no gap — i.e. the "36" badge appears to be stale/wrong on
// the site's own end, not a gap in this extraction. Two of those 33 majors
// (Biology, Exercise Physiology) offer both a B.A. and a B.S., which brings
// the true major+credential count to 35 — still short of 36, but there is no
// further evidence of a missing card anywhere in the static DOM.
//
// Excluded throughout: all 38 Minors, and the non-major "Core Curriculum"
// card (the gen-ed core, not a degree).
//
// Programs: 42 (35 bachelor, 7 graduate)
//
// Ave Maria is a four-year university (like UM/Stetson/ERAU/UT/Barry/Lynn/
// Rollins/Flagler/PBA/FIT/Saint Leo/STU), so pathways start at the
// bachelor's rather than an associate degree.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

const CATALOG_URL = "https://catalog.avemaria.edu/programs";

export const AVEMARIA_PROGRAMS: SchoolProgram[] = [
  { name: "Accounting", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Business" },
  { name: "American Studies", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Politics" },
  { name: "Applied Chemistry", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Chemistry & Physics" },
  { name: "Biochemistry", url: CATALOG_URL, level: "bachelor", credential: "BS", area: "Chemistry & Physics" },
  { name: "Biology", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Biology" },
  { name: "Biology", url: CATALOG_URL, level: "bachelor", credential: "BS", area: "Biology" },
  { name: "Business Administration", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Business" },
  { name: "Classics & Early Christian Literature, Classical Languages Option", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Classics & Early Christian Literature" },
  { name: "Classics & Early Christian Literature, Latin Option", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Classics & Early Christian Literature" },
  { name: "Communications", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Communications & Literature" },
  { name: "Computer Science", url: CATALOG_URL, level: "bachelor", credential: "BS", area: "Computational & Mathematical Sciences" },
  { name: "Economics", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Economics" },
  { name: "Elementary Education", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Education" },
  { name: "Environmental, Marine, and Freshwater Biology", url: CATALOG_URL, level: "bachelor", credential: "BS", area: "Biology" },
  { name: "Exercise Physiology", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Biology" },
  { name: "Exercise Physiology", url: CATALOG_URL, level: "bachelor", credential: "BS", area: "Biology" },
  { name: "Finance", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Business" },
  { name: "Global Affairs", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Economics" },
  { name: "Health Science", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Biology" },
  { name: "History", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "History" },
  { name: "Humanities & Liberal Studies", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Humanities" },
  { name: "Literature", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Communications & Literature" },
  { name: "Managerial Economics & Strategic Analysis", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Economics" },
  { name: "Marketing", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Business" },
  { name: "Mathematics", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Computational & Mathematical Sciences" },
  { name: "Mechanical Engineering", url: CATALOG_URL, level: "bachelor", credential: "BS", area: "Chemistry & Physics" },
  { name: "Music", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Music" },
  { name: "Nursing", url: CATALOG_URL, level: "bachelor", credential: "BSN", area: "Nursing" },
  { name: "Philosophy", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Philosophy" },
  { name: "Physics", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Chemistry & Physics" },
  { name: "Political Economy & Government", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Politics" },
  { name: "Politics", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Politics" },
  { name: "Psychology", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Psychology" },
  { name: "Quantitative Economics", url: CATALOG_URL, level: "bachelor", credential: "BS", area: "Economics" },
  { name: "Theology", url: CATALOG_URL, level: "bachelor", credential: "BA", area: "Theology" },

  { name: "Business Administration", url: CATALOG_URL, level: "graduate", credential: "MBA", area: "Business" },
  { name: "Catholic Educational Leadership", url: CATALOG_URL, level: "graduate", credential: "MEd", area: "Education" },
  { name: "Catholic Educational Leadership, Classical Liberal Arts Education Emphasis", url: CATALOG_URL, level: "graduate", credential: "MEd", area: "Education" },
  { name: "Communications, Rhetoric & Writing", url: CATALOG_URL, level: "graduate", credential: "MA", area: "Communications & Literature" },
  { name: "Philosophy", url: CATALOG_URL, level: "graduate", credential: "MA", area: "Philosophy" },
  { name: "Theology", url: CATALOG_URL, level: "graduate", credential: "MA", area: "Theology" },
  { name: "Theology", url: CATALOG_URL, level: "graduate", credential: "PhD", area: "Theology" },
];

export const avemariaCatalog = createProgramCatalog(AVEMARIA_PROGRAMS);
