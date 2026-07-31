// Which schools a plan gets generated against.
//
// Vocation 1.0 had the student name a school and planned against that one.
// 2.0 asks about their life instead and derives up to three schools from it:
//
//   local       the closest public school they could realistically commute to
//   affordable  the cheapest route that still reaches the career
//   desired     the school they actually named, if we hold its catalog
//
// The three collapse when they coincide, which they often do — a Miami student
// who names MDC and wants the cheap option gets one track, not three
// identical ones. That collapse is the point: it costs one generation instead
// of three, and it tells the student something true ("your local school IS the
// cheap option") rather than padding the page.
//
// SERVER ONLY. This imports every school catalog to check whether a school
// actually teaches anything relevant to the career, which is ~2 MB of program
// data. Importing it into a client component would ship all of that to the
// browser. The client gets the resolved tracks from /api/plan-tracks instead.

import { SCHOOLS_WITH_CATALOG } from "@/app/lib/schoolCatalogs";
import { getSchoolById, type SchoolKind } from "@/app/lib/floridaSchools";
import { catalogFor } from "@/app/lib/programCatalogs";
import {
  MDC_ASSOCIATE_ARTS_URL_MAPPING,
  MDC_ASSOCIATE_SCIENCE_URL_MAPPING,
  MDC_BACHELORS_URL_MAPPING,
} from "@/app/lib/mdc-programs";
import { annualCostFor } from "@/app/lib/planCost";
import {
  distanceToSchool,
  ELSEWHERE_REGION_ID,
  getRegion,
  schoolsNearestTo,
} from "@/app/lib/geography";
import type { EducationLevel, IntakeAnswers } from "@/app/lib/intake";
import type { PlanTrack, ResolvedTracks, TrackKind } from "@/app/lib/planTypes";

export type { PlanTrack, ResolvedTracks, TrackKind };

// --- Which schools suit the student's current level -------------------------

type EntryTier = "entry" | "transfer" | "advanced";

function entryTier(level: EducationLevel | undefined): EntryTier {
  switch (level) {
    case "associate":
      return "transfer";
    case "bachelor":
    case "graduate":
      return "advanced";
    default:
      // Still in high school, just finished, or partway through a degree —
      // a two-year college is on the table and is usually the cheap start.
      return "entry";
  }
}

const UNIVERSITY_KINDS: SchoolKind[] = ["public-university", "private"];

function tierAllows(tier: EntryTier, kind: SchoolKind): boolean {
  // Someone holding a degree has nothing to gain from starting an associate,
  // so the two-year colleges drop out above the entry tier. A few of them do
  // grant bachelor's degrees, but their catalogs are overwhelmingly
  // lower-division and the generated pathway reflects that.
  if (tier === "entry") return true;
  return UNIVERSITY_KINDS.includes(kind);
}

// --- Does this school teach anything relevant? ------------------------------

// Words that appear in job titles without narrowing what you'd study. Left in,
// "Registered Nurse" matches any program with "registered" in the title and
// the score stops meaning anything.
const CAREER_STOPWORDS = new Set([
  "registered",
  "certified",
  "licensed",
  "professional",
  "senior",
  "junior",
  "assistant",
  "associate",
  "specialist",
  "worker",
  "officer",
  "manager",
  "director",
  "board",
  "chief",
  "head",
  "lead",
  "the",
  "and",
  "for",
  "with",
]);

const MIN_TOKEN_LENGTH = 4;
const MIN_SHARED_PREFIX = 4;

function careerTokens(career: string): string[] {
  return career
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= MIN_TOKEN_LENGTH && !CAREER_STOPWORDS.has(word));
}

/**
 * Whether two words plausibly name the same subject.
 *
 * Prefix comparison rather than a stemmer, because the pairs that matter here
 * are morphological ("nurse"/"nursing", "psychologist"/"psychology",
 * "accountant"/"accounting") and all of them share a long prefix. Four
 * characters is the floor that catches "nurs" without letting "bio" match
 * "biomedical" from a career about biology.
 */
function sharesSubject(a: string, b: string): boolean {
  const limit = Math.min(a.length, b.length);
  let shared = 0;
  while (shared < limit && a[shared] === b[shared]) shared++;
  return shared >= MIN_SHARED_PREFIX;
}

function programNamesFor(schoolId: string): string[] {
  // MDC predates the catalog registry and keeps its programs as URL maps —
  // see programCatalogs.ts. Its keys are the program titles.
  if (schoolId === "mdc") {
    return [
      ...Object.keys(MDC_ASSOCIATE_ARTS_URL_MAPPING),
      ...Object.keys(MDC_ASSOCIATE_SCIENCE_URL_MAPPING),
      ...Object.keys(MDC_BACHELORS_URL_MAPPING),
    ];
  }
  return catalogFor(schoolId)?.programs.map((p) => p.name) ?? [];
}

/**
 * How many of a school's programs plausibly relate to the career.
 *
 * Used to rank, never to reject outright — see `relevantPool`. A zero here
 * means "we found no textual link", which is not the same as "this school
 * can't get you there": a physician starts in biology, and no amount of string
 * matching connects those two words.
 */
export function relevanceScore(schoolId: string, career: string): number {
  const tokens = careerTokens(career);
  if (!tokens.length) return 0;

  let score = 0;
  for (const name of programNamesFor(schoolId)) {
    const programWords = name
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= MIN_TOKEN_LENGTH);

    if (tokens.some((t) => programWords.some((w) => sharesSubject(t, w)))) {
      score++;
    }
  }
  return score;
}

// How many schools must score before the signal is worth acting on.
//
// Token overlap between a job title and a degree title is reliable only when
// it fires BROADLY. "Nurse" hits nursing programs at nearly every school in
// the state; that's a real field and filtering on it is sound. "Pediatrician"
// hit exactly two schools — EFSC's "Adult and Pediatric Cardiac Sonography"
// and SPC's "Advanced Neonatal and Pediatric Respiratory Care" — neither of
// which is remotely a route to becoming a pediatrician. Trusting that match
// evicted every other school from the pool, and a Miami student was told
// their closest option was 184 miles away in Cocoa.
//
// So a match has to be common to count. Below this floor the term is treated
// as idiosyncratic and the full pool is used, which is the same behavior 1.0
// had: let the catalog-grounded prompt pick the program, since that's its job.
const MIN_RELEVANT_SCHOOLS = 5;

/**
 * Narrow the candidates to schools that teach something related, but only when
 * the signal is broad enough to mean anything.
 */
function relevantPool(candidates: string[], career: string): string[] {
  const scored = candidates
    .map((id) => ({ id, score: relevanceScore(id, career) }))
    .filter((entry) => entry.score > 0);

  return scored.length >= MIN_RELEVANT_SCHOOLS
    ? scored.map((entry) => entry.id)
    : candidates;
}

// --- Picking each track -----------------------------------------------------

const costMidpoint = (schoolId: string, tier: EntryTier): number => {
  const { range } = annualCostFor(schoolId, tier === "entry" ? "associate" : "bachelor");
  return (range.low + range.high) / 2;
};

function describeDistance(miles: number | null): string {
  if (miles === null) return "";
  if (miles < 10) return "in your area";
  return `about ${Math.round(miles)} mi away`;
}

function pickLocal(
  pool: string[],
  regionId: string,
  tier: EntryTier
): string | null {
  // "Local" means commutable, which in practice means public. A private
  // university ten minutes away is a fine school and a poor answer to "what's
  // my local option" — the desired track is where those belong.
  const commutable = pool.filter((id) => {
    const kind = getSchoolById(id)?.kind;
    return kind === "state-college" || kind === "public-university";
  });

  const ranked = schoolsNearestTo(regionId, commutable.length ? commutable : pool);
  return ranked.find((id) => tierAllows(tier, getSchoolById(id)?.kind ?? "private")) ?? null;
}

function pickAffordable(
  pool: string[],
  regionId: string,
  tier: EntryTier
): string | null {
  const eligible = pool.filter((id) =>
    tierAllows(tier, getSchoolById(id)?.kind ?? "private")
  );
  if (!eligible.length) return null;

  const cheapest = Math.min(...eligible.map((id) => costMidpoint(id, tier)));
  // Florida sets state-college tuition by statute, so dozens of schools tie at
  // the exact bottom. Distance is the tiebreaker that makes the pick useful
  // rather than alphabetical: the cheapest school you can't get to is not the
  // cheapest school.
  const tied = eligible.filter(
    (id) => costMidpoint(id, tier) <= cheapest * 1.05
  );

  return schoolsNearestTo(regionId, tied)[0] ?? null;
}

function pickDesired(answers: IntakeAnswers): {
  schoolId: string | null;
  note: string | null;
} {
  const named = answers.desiredSchoolIds ?? [];
  if (!named.length) return { schoolId: null, note: null };

  const withCatalog = named.filter((id) =>
    (SCHOOLS_WITH_CATALOG as readonly string[]).includes(id)
  );

  if (withCatalog.length) return { schoolId: withCatalog[0], note: null };

  const names = named
    .map((id) => getSchoolById(id)?.name)
    .filter(Boolean)
    .join(", ");

  return {
    schoolId: null,
    note: `We don't hold a program catalog for ${names} yet, so it couldn't be planned against. Everything below uses schools we do have real program data for.`,
  };
}

// --- Assembly ---------------------------------------------------------------

const TRACK_TITLES: Record<TrackKind, string> = {
  local: "Closest to home",
  affordable: "Lowest cost",
  desired: "The school you named",
};

/** Order the cards appear in, driven by what the student said matters. */
function trackOrder(answers: IntakeAnswers): TrackKind[] {
  switch (answers.budgetPriority) {
    case "lowest-cost":
      return ["affordable", "local", "desired"];
    case "best-program":
      return ["desired", "local", "affordable"];
    default:
      return ["local", "affordable", "desired"];
  }
}

export function resolveTracks(answers: IntakeAnswers): ResolvedTracks {
  const notes: string[] = [];
  const career = answers.career?.resolved?.trim();

  if (!career) {
    return { tracks: [], notes: ["No career was given, so there's nothing to plan yet."] };
  }

  const tier = entryTier(answers.educationLevel);
  const regionId = answers.regionId ?? ELSEWHERE_REGION_ID;
  const inFlorida = Boolean(getRegion(regionId));

  const candidates = (SCHOOLS_WITH_CATALOG as readonly string[]).filter((id) =>
    tierAllows(tier, getSchoolById(id)?.kind ?? "private")
  );
  const pool = relevantPool([...candidates], career);

  const picks = new Map<TrackKind, string | null>();

  if (inFlorida) {
    // Deliberately the unfiltered candidates, not `pool`. "Closest to home"
    // means closest — narrowing it by program relevance first contradicts the
    // track's own definition and can only ever push the answer further away.
    picks.set("local", pickLocal([...candidates], regionId, tier));
  } else {
    notes.push(
      "You told us you're outside Florida. Vocation only holds Florida program catalogs right now, so there's no local option below — the routes shown are Florida schools, and out-of-state tuition would run higher than the figures here."
    );
    picks.set("local", null);
  }

  picks.set("affordable", pickAffordable(pool, regionId, tier));

  const desired = pickDesired(answers);
  if (desired.note) notes.push(desired.note);
  picks.set("desired", desired.schoolId);

  if (tier !== "entry") {
    notes.push(
      "Because you already hold a degree, two-year colleges were left out — these routes start at the level you're actually entering."
    );
  }

  // Collapse duplicates. The first track kind in priority order keeps the
  // card; the others are recorded on it so the card can say "this is also
  // your cheapest option" instead of appearing three times.
  const order = trackOrder(answers);
  const bySchool = new Map<string, PlanTrack>();

  for (const kind of order) {
    const schoolId = picks.get(kind);
    if (!schoolId) continue;

    const existing = bySchool.get(schoolId);
    if (existing) {
      existing.alsoCovers.push(kind);
      continue;
    }

    const school = getSchoolById(schoolId);
    if (!school) continue;

    const miles = inFlorida ? distanceToSchool(regionId, schoolId) : null;
    const proximity = describeDistance(miles);

    bySchool.set(schoolId, {
      kind,
      schoolId,
      schoolName: school.name,
      title: TRACK_TITLES[kind],
      subtitle: proximity ? `${school.name} · ${proximity}` : school.name,
      why: whyText(kind, school.name, proximity),
      alsoCovers: [],
      distanceMiles: miles,
    });
  }

  const tracks = order
    .map((kind) => [...bySchool.values()].find((t) => t.kind === kind))
    .filter((t): t is PlanTrack => Boolean(t));

  if (!tracks.length) {
    notes.push(
      "We couldn't match a school to that combination of answers. Try widening where you'd study, or check back as more school catalogs are added."
    );
  }

  return { tracks, notes };
}

function whyText(kind: TrackKind, schoolName: string, proximity: string): string {
  switch (kind) {
    case "local":
      return proximity
        ? `${schoolName} is the closest public school to you that we can plan a full route through, so you could do this without moving.`
        : `${schoolName} is the closest public school we can plan a full route through.`;
    case "affordable":
      return `${schoolName} is the cheapest per-year route to this career among the schools we hold real program data for.`;
    case "desired":
      return `You named ${schoolName}, so here's what the route actually looks like from there — including what it costs next to the other options.`;
  }
}
