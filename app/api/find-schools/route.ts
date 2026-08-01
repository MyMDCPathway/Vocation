import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { enforceGenerationLimits, recordGeneration } from "@/app/lib/rateLimit";
import { generateJson } from "@/app/lib/geminiJson";
import { logCacheMiss } from "@/app/lib/missLog";
import { resolveCareer } from "@/app/lib/careerCanonical";
import { countryName, hasLocalCatalogs } from "@/app/lib/countries";
import { FLORIDA_SCHOOLS, getSchoolById } from "@/app/lib/floridaSchools";
import { SCHOOLS_WITH_CATALOG } from "@/app/lib/schoolCatalogs";
import { distanceMiles, SCHOOL_COORDINATES } from "@/app/lib/geography";
import {
  hasUsableCoordinates,
  openSchoolId,
  type SchoolRef,
} from "@/app/lib/schoolRef";
import { archetypeProfile, type ArchetypeProfile } from "@/app/lib/routeArchetype";

// Which schools could get this student to this career, from where they live.
//
// Two sources, merged, and the merge is the whole point:
//
//   1. The 53 Florida schools we scraped. Real program lists, real URLs, real
//      prompt grounding. If the student is in Florida these are strictly
//      better than anything the model can tell us, so they are included
//      wholesale and marked source: "catalog".
//
//   2. Everything else on earth, from the model. Harvard, Oxford, UNAM, the
//      University of Tokyo. Marked source: "ai", carrying the URLs we'll later
//      verify by actually fetching them.
//
// Passing the career in matters. Asking "what schools are near Boston" gets a
// generic ranking; asking "what schools near Boston could make someone a
// pediatrician" gets schools with medical programs. This replaces the
// string-matching relevance score the Florida-only version used, which was
// weak enough to send a Miami student 184 miles for a career whose job title
// happened not to share a word with any nearby degree.

const apiKey = process.env.GEMINI_API_KEY;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    schools: {
      type: "ARRAY",
      description:
        "6-10 real, currently-operating institutions that could realistically lead to this career, nearest/most relevant first.",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Official name of the institution." },
          city: { type: "STRING", description: "City the main campus is in." },
          subdivision: {
            type: "STRING",
            description: "State, province, or region the school is in.",
          },
          kind: {
            type: "STRING",
            enum: [
              "state-college",
              "public-university",
              "private",
              "community-college",
              "unknown",
            ],
            description:
              "Use community-college for two-year and vocational institutions, public-university for state-funded degree-granting universities, private for independent ones.",
          },
          website: {
            type: "STRING",
            description: "The institution's homepage URL, including https://.",
          },
          programsUrl: {
            type: "STRING",
            description:
              "URL of the page listing all the school's programs, majors, or courses — the index, not a specific program. This is the fallback we link when a specific program page can't be confirmed, so it must be a real, stable page.",
          },
          annualTuitionLow: {
            type: "NUMBER",
            description: "Lower bound of annual tuition & fees, in the school's own currency.",
          },
          annualTuitionHigh: {
            type: "NUMBER",
            description: "Upper bound of annual tuition & fees, in the school's own currency.",
          },
          currency: {
            type: "STRING",
            description: "ISO 4217 code the tuition figures are in, e.g. USD, GBP, EUR, JPY.",
          },
          annualTuitionUsdLow: {
            type: "NUMBER",
            description: "Same lower bound converted to USD, for comparing schools across countries.",
          },
          annualTuitionUsdHigh: {
            type: "NUMBER",
            description: "Same upper bound converted to USD.",
          },
          latitude: {
            type: "NUMBER",
            description:
              "Latitude of the main campus, decimal degrees. Used to drop a pin on a map, so a wrong value visibly puts the school in the wrong place. If you are not confident, give the coordinates of the city centre rather than guessing at a campus.",
          },
          longitude: {
            type: "NUMBER",
            description: "Longitude of the main campus, decimal degrees.",
          },
          distanceNote: {
            type: "STRING",
            description:
              "How far it is from the city given, in plain words: 'in the city', 'about 40 km away', 'a 2-hour train'.",
          },
          note: {
            type: "STRING",
            description:
              "One sentence on what this school offers that's relevant to this specific career.",
          },
        },
        required: [
          "name",
          "city",
          "subdivision",
          "kind",
          "website",
          "programsUrl",
          "annualTuitionLow",
          "annualTuitionHigh",
          "currency",
          "annualTuitionUsdLow",
          "annualTuitionUsdHigh",
          "latitude",
          "longitude",
          "distanceNote",
          "note",
        ],
      },
    },
  },
  required: ["schools"],
};

function systemPrompt(profile: ArchetypeProfile): string {
  return `You identify real TRAINING PROVIDERS that could get a student into a specific career, given where they live.

THE ROUTE MATTERS MORE THAN ANYTHING ELSE HERE.
This career is entered by: ${profile.label}. ${profile.summary}

So what you are looking for is: ${profile.discoveryTarget}.

Do NOT return universities for a career that isn't entered through one. Someone who wants to weld needs union halls, trade schools, and contractors taking apprentices — a list of degree programs is a wrong answer, not a partial one. Match the route.

HARD RULES:
- Every provider must genuinely exist and currently take on students or apprentices. Never invent one, and never merge two real organisations into one name.
- Include a provider ONLY if it plausibly trains people for the stated career.
- Prefer providers in or near the stated city. Include the nearest realistic options even if that means a neighbouring city or region, and say so in distanceNote.
- Give a mix where one exists: cheaper options AND stronger-reputation options, so the student can see the trade. Do not return six near-identical private universities.

URLS — these are checked:
- website must be the provider's real homepage.
- programsUrl must be a real page that LISTS what they offer — a course finder, an apprenticeship intake page, a certification catalogue, a majors index. Not a specific program page, not the homepage, not a search results URL with query parameters.
- If you are not confident a specific URL is correct, give the homepage for website and the closest thing to a listing page you are confident about. A URL we can fetch matters more than a URL that looks precise.

COST:
- Quote what the student would actually pay per year, in local currency, plus a USD conversion so options in different places can be compared.
- **Where the route PAYS the trainee rather than charging them — most registered apprenticeships, and military service — use 0 for the cost fields and say so in the note.** Printing a tuition figure for an apprenticeship that pays a wage is worse than printing nothing.
- Figures are estimates and labelled as such, but they must be the right order of magnitude.

COORDINATES:
- These drop a pin on a map the student looks at, so an error is immediately visible — a provider in the wrong county is obvious, and one in the wrong ocean is worse.
- Give the main site if you know it. If you don't, give the centre of the city you named; being a mile off is invisible, being in the wrong country is not.

Return only JSON matching the schema.`;
}

function catalogSchoolsFor(
  city: string,
  origin: { lat: number; lng: number } | undefined
): SchoolRef[] {

  return (SCHOOLS_WITH_CATALOG as readonly string[])
    .map((id) => {
      const school = getSchoolById(id)!;
      const coords = SCHOOL_COORDINATES[id];
      return {
        id,
        name: school.name,
        city: school.city,
        subdivision: "Florida",
        countryCode: "US",
        kind: school.kind,
        source: "catalog" as const,
        distanceMiles: origin && coords ? distanceMiles(origin, coords) : null,
        // Hand-compiled in geography.ts, so these are the trustworthy pins.
        latitude: coords?.lat,
        longitude: coords?.lng,
        note: "We hold this school's full program catalog, so its plan is built from real programs rather than estimated.",
      } satisfies SchoolRef;
    })
    .sort((a, b) => {
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });
}

/**
 * Measure every school from this student, then sort nearest first.
 *
 * Distance is computed HERE, at response time, rather than stored — because
 * the cache key is country/region/city/career and does not include the
 * student's exact coordinates. Two students in the same city with different
 * postcodes share a cache entry, and a stored distance would hand the second
 * one the first one's mileage. The coordinates are the durable fact; the
 * distance is derived from them per request.
 *
 * A school we can't place sorts last rather than to zero, which is where a
 * missing distance would otherwise land it — the top of a list whose entire
 * promise is "nearest first".
 */
/**
 * Collapse the same school appearing from both sources.
 *
 * The prompt tells the model to skip Florida's public colleges and state
 * universities because we already hold those, but Barry and the University of
 * Miami are PRIVATE — so they're in our catalog *and* a reasonable thing for
 * the model to suggest, and the student saw each of them listed twice with
 * two pins a few hundred metres apart.
 *
 * The catalog copy always wins: its programs are real rather than estimated,
 * and its coordinates were compiled by hand. Matching is on a normalised name,
 * because the two sources punctuate differently ("St. Thomas University" vs
 * "St Thomas University").
 */
function dedupeByName(schools: SchoolRef[]): SchoolRef[] {
  const normalize = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(the|university|college|of|at)\b/g, " ")
      .trim()
      .replace(/\s+/g, " ");

  const bySchool = new Map<string, SchoolRef>();
  for (const school of schools) {
    const key = normalize(school.name) || school.id;
    const existing = bySchool.get(key);
    if (!existing) {
      bySchool.set(key, school);
      continue;
    }
    if (existing.source !== "catalog" && school.source === "catalog") {
      bySchool.set(key, school);
    }
  }
  return [...bySchool.values()];
}

function withDistances(
  schools: SchoolRef[],
  origin: { lat: number; lng: number } | undefined
): SchoolRef[] {
  return dedupeByName(schools)
    .map((school) => ({
      ...school,
      distanceMiles:
        origin && hasUsableCoordinates(school)
          ? distanceMiles(origin, { lat: school.latitude, lng: school.longitude })
          : null,
    }))
    .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
}

/** Coordinates to measure school distances from, or undefined if we have none. */
function resolveOrigin(
  latitude: unknown,
  longitude: unknown,
  city: string
): { lat: number; lng: number } | undefined {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
    return { lat, lng };
  }

  const normalized = city.trim().toLowerCase();
  if (!normalized) return undefined;

  const anchor = FLORIDA_SCHOOLS.find(
    (school) => school.city.toLowerCase() === normalized
  );
  return anchor ? SCHOOL_COORDINATES[anchor.id] : undefined;
}

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { career, countryCode, subdivision, city, latitude, longitude, routeArchetype } =
      await request.json();

    if (!career || typeof career !== "string" || !career.trim()) {
      return NextResponse.json(
        { error: "A career is required to find relevant schools." },
        { status: 400 }
      );
    }
    if (!countryCode || typeof countryCode !== "string") {
      return NextResponse.json({ error: "A country is required." }, { status: 400 });
    }

    const canonicalCareer = resolveCareer(career).canonical;
    const place = [city, subdivision].filter(Boolean).join(", ");
    const profile = archetypeProfile(routeArchetype);

    // Where to measure distances from, best source first:
    //
    //   1. Coordinates resolved from the student's postal code. Exact, and
    //      available anywhere the lookup service covers.
    //   2. The campus coordinates of a school in a city of the same name.
    //      Florida-only and city-granular, but enough to tell Miami from
    //      Pensacola, which is all the ranking needs.
    //
    // With neither, distances stay null and the UI shows the track's label
    // instead of a mileage rather than inventing one.
    const origin = resolveOrigin(latitude, longitude, String(city ?? ""));

    // Catalog schools are free and deterministic, so they're assembled outside
    // the cache and merged onto whatever the AI half returns.
    // The catalog is 53 Florida COLLEGES. Merging it into an apprenticeship
    // or enlistment route is the original bug this classification fixes: a
    // welder was handed every university in the state. Only routes that
    // genuinely run through a degree-granting institution get it.
    const catalog =
      profile.usesCollegeCatalog && hasLocalCatalogs(countryCode, subdivision)
        ? catalogSchoolsFor(String(city ?? ""), origin)
        : [];

    // The archetype is part of the key because it changes the answer: the
    // same career in the same city returns union halls or universities
    // depending on it.
    const key = cacheKey(
      "schools",
      `${countryCode}|${subdivision ?? ""}|${city ?? ""}|${canonicalCareer}|${profile.id}`
    );

    const cached = getCached<SchoolRef[]>(key);
    if (cached) {
      return NextResponse.json({ schools: withDistances([...catalog, ...cached], origin) });
    }

    const durable = await getDurable<SchoolRef[]>(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json({ schools: withDistances([...catalog, ...durable], origin) });
    }

    const limited = enforceGenerationLimits(request);
    if (limited) return limited;
    recordGeneration();
    logCacheMiss("schools", `${place} / ${career}`, canonicalCareer);

    const result = await generateJson<{ schools: any[] }>({
      apiKey,
      systemPrompt: systemPrompt(profile),
      userQuery: `A student living in ${place || countryName(countryCode)}, ${countryName(
        countryCode
      )} wants to become a "${canonicalCareer}".

This career is entered by ${profile.label.toLowerCase()}, so find ${profile.discoveryTarget} in or near ${place || countryName(countryCode)} — with the URLs and cost figures the schema asks for.${
        catalog.length
          ? `\n\nDo NOT include Florida public colleges or state universities — those are already covered from our own data. Include private, out-of-state, or international options that add something different.`
          : ""
      }`,
      responseSchema: RESPONSE_SCHEMA,
      // Low but not zero: school names and URLs are recall, and sampling here
      // is how you get a plausible-looking university that doesn't exist.
      temperature: 0.2,
    });

    if (!result.ok) {
      // The catalog half still works when the AI half fails, so a Florida
      // student gets a usable answer rather than an error page.
      if (catalog.length) {
        return NextResponse.json({ schools: withDistances(catalog, origin), partial: true });
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const discovered: SchoolRef[] = (result.data.schools ?? [])
      .filter((entry) => entry?.name)
      .map((entry) => ({
        id: openSchoolId(entry.name),
        name: entry.name,
        city: entry.city ?? "",
        subdivision: entry.subdivision ?? String(subdivision ?? ""),
        countryCode: String(countryCode).toUpperCase(),
        kind: entry.kind ?? "unknown",
        source: "ai" as const,
        website: entry.website || undefined,
        programsUrl: entry.programsUrl || undefined,
        tuition: {
          low: Number(entry.annualTuitionLow) || 0,
          high: Number(entry.annualTuitionHigh) || 0,
          currency: entry.currency || "USD",
          usdLow: Number(entry.annualTuitionUsdLow) || 0,
          usdHigh: Number(entry.annualTuitionUsdHigh) || 0,
        },
        latitude: Number(entry.latitude),
        longitude: Number(entry.longitude),
        distanceMiles: null,
        note: [entry.note, entry.distanceNote].filter(Boolean).join(" · "),
      }))
      // Drop coordinates that failed validation rather than pinning a school
      // into the sea, and — now that AI schools carry coordinates at all —
      // give them a real distance instead of the null they used to get. This
      // is what makes "nearest first" mean something outside Florida.
      .map((school) => {
        const placed = hasUsableCoordinates(school);
        return {
          ...school,
          latitude: placed ? school.latitude : undefined,
          longitude: placed ? school.longitude : undefined,
          distanceMiles:
            placed && origin
              ? distanceMiles(origin, { lat: school.latitude, lng: school.longitude })
              : null,
        };
      });

    if (discovered.length) {
      setCached(key, discovered);
      await setDurable(key, discovered);
    }

    return NextResponse.json({ schools: withDistances([...catalog, ...discovered], origin) });
  } catch (error: any) {
    console.error("Error finding schools:", error);
    return NextResponse.json(
      { error: "Failed to find schools for that location." },
      { status: 500 }
    );
  }
}
