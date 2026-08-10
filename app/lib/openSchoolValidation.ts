// A student-supplied SchoolRef for an AI-discovered ("open:") school reaches
// /api/generate-pathway with no catalog to check it against — by definition,
// an open school is one Vocation has no scraped record of. Two things follow,
// and this file exists to handle both:
//
//   1. The school's IDENTITY is verifiable. schoolRef.ts's own openSchoolId()
//      is a deterministic slug of the name, and an "open:" id is supposed to
//      BE that slug. A request whose `school` id doesn't match
//      openSchoolId(schoolRef.name) isn't describing a real lookup — reject
//      it rather than trust it anyway.
//
//   2. The school's CONTENT (city, website, programsUrl, note...) is NOT
//      verifiable — there's nothing to check it against — but it goes
//      straight into the Gemini system prompt, and the route's cache key was
//      built from schoolId + archetype + career only. That meant one request
//      with fabricated content and a real school's name overwrote the
//      durable, 30-day-TTL cache entry every later visitor asking about that
//      real school would be served — an unauthenticated cache-poisoning
//      route. See schoolRefFingerprint below.

import { createHash } from "crypto";
import { isOpenSchool, openSchoolId, type SchoolKindRef, type SchoolRef } from "@/app/lib/schoolRef";

const SCHOOL_KINDS: SchoolKindRef[] = [
  "state-college",
  "public-university",
  "private",
  "community-college",
  "unknown",
];

// Generous enough for a real name, city, or URL; small enough that a request
// body can't inflate the prompt (and the Gemini bill) by stuffing kilobytes
// into one field. Mirrors careerPolicy.ts's MAX_CAREER_INPUT in spirit.
const MAX_FIELD_LEN = 200;
const MAX_NOTE_LEN = 400;

function cappedString(value: unknown, max: number = MAX_FIELD_LEN): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Validates and normalizes a client-supplied schoolRef against the school id
 * the request claims. Returns null when it doesn't describe a real
 * open-school lookup — the caller should treat that exactly like an
 * uncatalogued school (reject), never fall back to trusting the raw input.
 */
export function validateOpenSchoolRef(schoolId: string, raw: unknown): SchoolRef | null {
  if (!isOpenSchool(schoolId)) return null;
  if (!raw || typeof raw !== "object") return null;

  const name = cappedString((raw as Record<string, unknown>).name);
  if (!name) return null;

  // The one fact about an open school we CAN check without a catalog: its id
  // is defined as a deterministic function of its name (schoolRef.ts). A
  // mismatch means this id wasn't produced by looking up this name.
  if (schoolId !== openSchoolId(name)) return null;

  const r = raw as Record<string, unknown>;
  const kind = SCHOOL_KINDS.includes(r.kind as SchoolKindRef) ? (r.kind as SchoolKindRef) : "unknown";
  const latitude = typeof r.latitude === "number" && Number.isFinite(r.latitude) ? r.latitude : undefined;
  const longitude = typeof r.longitude === "number" && Number.isFinite(r.longitude) ? r.longitude : undefined;

  return {
    id: schoolId,
    name,
    city: cappedString(r.city),
    subdivision: cappedString(r.subdivision),
    countryCode: cappedString(r.countryCode, 8) || "US",
    kind,
    source: "ai",
    website: cappedString(r.website) || undefined,
    programsUrl: cappedString(r.programsUrl) || undefined,
    note: cappedString(r.note, MAX_NOTE_LEN) || undefined,
    latitude,
    longitude,
  };
}

/**
 * A short, stable fingerprint of everything about this school that reaches
 * the Gemini prompt. Folded into the cache key so two requests for the same
 * school id with DIFFERENT content can never read or write each other's
 * cache entry: a forged request gets its own key and can only poison what it
 * reads back itself, never what a legitimate request reads back. Deliberately
 * excludes latitude/longitude/kind — cosmetic (map pin, badge), not part of
 * what the model is told to plan against.
 */
export function schoolRefFingerprint(school: SchoolRef): string {
  const material = [
    school.name,
    school.city,
    school.subdivision,
    school.countryCode,
    school.website ?? "",
    school.programsUrl ?? "",
    school.note ?? "",
  ]
    .join("|")
    .toLowerCase();
  return createHash("sha256").update(material, "utf8").digest("hex").slice(0, 16);
}
