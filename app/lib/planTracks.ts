// Which of the discovered schools become the three routes.
//
// This used to import every scraped catalog to score whether a school taught
// anything relevant to the career, which is why it was server-only. It doesn't
// any more: /api/find-schools is given the career and returns schools that are
// already relevant to it, which is both a better signal than prefix-matching
// job titles against degree titles and the reason this file is now pure.
//
// (The old approach is worth remembering. Matching "Pediatrician" against
// program names hit two schools in Florida, neither of which was a route to
// becoming one, and a Miami student was told their closest option was 184
// miles away. Asking the model "which schools near here could make someone a
// pediatrician" does not have that failure mode.)

import { getSchoolById } from "@/app/lib/floridaSchools";
import { annualCostFor } from "@/app/lib/planCost";
import { isOpenSchool, type SchoolRef } from "@/app/lib/schoolRef";
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
      return "entry";
  }
}

const TWO_YEAR_KINDS = new Set(["state-college", "community-college"]);

function tierAllows(tier: EntryTier, school: SchoolRef): boolean {
  // Someone already holding a degree has nothing to gain from starting at a
  // two-year college, so those drop out above the entry tier.
  if (tier === "entry") return true;
  return !TWO_YEAR_KINDS.has(school.kind);
}

// --- Cost ------------------------------------------------------------------

/**
 * Annual cost in USD, however we know it.
 *
 * A catalog school is priced from the tables in planCost.ts, which are curated
 * or sector-derived. An AI-discovered school carries its own estimate from the
 * discovery call. Returns null when neither is available, and callers must
 * treat that as "unknown" rather than "free" — a school with no price must not
 * win the cheapest track by default.
 */
export function annualUsdMidpoint(
  school: SchoolRef,
  tier: EntryTier
): number | null {
  if (!isOpenSchool(school.id) && getSchoolById(school.id)) {
    const { range } = annualCostFor(
      school.id,
      tier === "entry" ? "associate" : "bachelor"
    );
    return (range.low + range.high) / 2;
  }

  const usd = school.tuition;
  if (!usd || (!usd.usdLow && !usd.usdHigh)) return null;
  return (usd.usdLow + usd.usdHigh) / 2;
}

// --- Picking each track -----------------------------------------------------

function sameCity(school: SchoolRef, city: string | undefined): boolean {
  if (!city) return false;
  return school.city.trim().toLowerCase() === city.trim().toLowerCase();
}

/**
 * The closest school we can plan through.
 *
 * Distance is only computable for the Florida schools we hold coordinates for.
 * Everywhere else, "closest" falls back to a city-name match and then to
 * discovery order, which the prompt asks to be nearest-first. That ordering is
 * softer than a real distance and the subtitle says "in {city}" rather than a
 * mileage, so the UI never claims a precision it doesn't have.
 */
function pickLocal(schools: SchoolRef[], answers: IntakeAnswers): SchoolRef | null {
  const eligible = schools.filter((s) => tierAllows(entryTier(answers.educationLevel), s));
  if (!eligible.length) return null;

  const measured = eligible.filter((s) => typeof s.distanceMiles === "number");
  if (measured.length) {
    return measured.reduce((best, s) =>
      (s.distanceMiles ?? Infinity) < (best.distanceMiles ?? Infinity) ? s : best
    );
  }

  return (
    eligible.find((s) => sameCity(s, answers.location?.city)) ?? eligible[0]
  );
}

function pickAffordable(
  schools: SchoolRef[],
  answers: IntakeAnswers
): SchoolRef | null {
  const tier = entryTier(answers.educationLevel);
  const priced = schools
    .filter((s) => tierAllows(tier, s))
    .map((s) => ({ school: s, cost: annualUsdMidpoint(s, tier) }))
    .filter((entry): entry is { school: SchoolRef; cost: number } => entry.cost !== null);

  if (!priced.length) return null;

  const cheapest = Math.min(...priced.map((p) => p.cost));

  // Florida sets state-college tuition by statute, so dozens of schools tie at
  // the exact bottom. Among ties, prefer the nearest — the cheapest school you
  // can't get to is not the cheapest school.
  const tied = priced.filter((p) => p.cost <= cheapest * 1.05).map((p) => p.school);
  return pickLocal(tied, answers) ?? tied[0];
}

function pickDesired(
  schools: SchoolRef[],
  answers: IntakeAnswers
): { school: SchoolRef | null; note: string | null } {
  const named = answers.desiredSchools ?? [];
  if (!named.length) return { school: null, note: null };

  // The stored pick is a snapshot from the schools step. Prefer the copy from
  // this resolve so any fresher URLs or tuition figures win, but fall back to
  // the snapshot — a school that dropped out of a later discovery call is
  // still the school the student asked for.
  const first = named[0];
  const fresh = schools.find((s) => s.id === first.id);
  return { school: fresh ?? first, note: null };
}

// --- Assembly ---------------------------------------------------------------

const TRACK_TITLES: Record<TrackKind, string> = {
  local: "Closest to home",
  affordable: "Lowest cost",
  desired: "The school you named",
};

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

function proximityLabel(school: SchoolRef, answers: IntakeAnswers): string {
  if (typeof school.distanceMiles === "number") {
    return school.distanceMiles < 10
      ? "in your area"
      : `about ${Math.round(school.distanceMiles)} mi away`;
  }
  if (sameCity(school, answers.location?.city)) return `in ${school.city}`;
  return school.city || "";
}

function whyText(kind: TrackKind, school: SchoolRef, proximity: string): string {
  switch (kind) {
    case "local":
      return proximity
        ? `${school.name} is the closest school to you we can plan a full route through, so you could do this without moving.`
        : `${school.name} is the closest school we can plan a full route through.`;
    case "affordable":
      return `${school.name} is the cheapest per-year route to this career among the schools we found for you.`;
    case "desired":
      return `You named ${school.name}, so here's what the route actually looks like from there — including what it costs next to the other options.`;
  }
}

export function resolveTracks(
  answers: IntakeAnswers,
  schools: SchoolRef[]
): ResolvedTracks {
  const notes: string[] = [];

  if (!answers.career?.resolved?.trim()) {
    return { tracks: [], notes: ["No career was given, so there's nothing to plan yet."] };
  }

  if (!schools.length) {
    return {
      tracks: [],
      notes: [
        "We couldn't find schools for that location. Try a larger nearby city, or a different region.",
      ],
    };
  }

  const tier = entryTier(answers.educationLevel);
  if (tier !== "entry" && schools.some((s) => TWO_YEAR_KINDS.has(s.kind))) {
    notes.push(
      "Because you already hold a degree, two-year colleges were left out — these routes start at the level you're actually entering."
    );
  }

  const picks = new Map<TrackKind, SchoolRef | null>();
  picks.set("local", pickLocal(schools, answers));
  picks.set("affordable", pickAffordable(schools, answers));

  const desired = pickDesired(schools, answers);
  if (desired.note) notes.push(desired.note);
  picks.set("desired", desired.school);

  if (!picks.get("affordable")) {
    notes.push(
      "None of these schools came with a usable tuition figure, so there's no separate cheapest option below — compare the estimates on each route instead."
    );
  }

  // Collapse duplicates. The first kind in priority order keeps the card; the
  // others are recorded on it, so a school that is both closest and cheapest
  // says so once instead of appearing twice.
  const order = trackOrder(answers);
  const bySchool = new Map<string, PlanTrack>();

  for (const kind of order) {
    const school = picks.get(kind);
    if (!school) continue;

    const existing = bySchool.get(school.id);
    if (existing) {
      existing.alsoCovers.push(kind);
      continue;
    }

    const proximity = proximityLabel(school, answers);
    bySchool.set(school.id, {
      kind,
      school,
      title: TRACK_TITLES[kind],
      subtitle: proximity ? `${school.name} · ${proximity}` : school.name,
      why: whyText(kind, school, proximity),
      alsoCovers: [],
    });
  }

  const tracks = order
    .map((kind) => [...bySchool.values()].find((t) => t.kind === kind))
    .filter((t): t is PlanTrack => Boolean(t));

  if (!tracks.length) {
    notes.push(
      "We couldn't match a school to that combination of answers. Try widening where you'd study."
    );
  }

  return { tracks, notes };
}
