import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { enforceGenerationLimits, recordGeneration } from "@/app/lib/rateLimit";
import { generateJson } from "@/app/lib/geminiJson";
import { logCacheMiss } from "@/app/lib/missLog";
import { hasUsableCoordinates, openSchoolId, type SchoolRef } from "@/app/lib/schoolRef";
import { normalizeCareer } from "@/app/lib/careerCanonical";
import {
  blockedCareer,
  BLOCKED_CAREER_MESSAGE,
  MAX_CAREER_INPUT,
  TOO_LONG_MESSAGE,
} from "@/app/lib/careerPolicy";

// Find one specific school the student asked for by name.
//
// /api/find-schools answers "what's near me for this career". This answers
// "I want Harvard" — a student who already has a school in mind shouldn't be
// limited to the six or eight we suggested, and typing a name they know is
// the fastest path to the plan they actually came for.
//
// Deliberately returns UP TO THREE candidates rather than one. "Cambridge"
// is two famous universities on two continents, and "St Andrews" is a
// university, a school, and a town. Guessing which one they meant and being
// wrong is worse than showing them the choice.

const apiKey = process.env.GEMINI_API_KEY;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    matches: {
      type: "ARRAY",
      description:
        "Up to 3 real institutions matching the search, best match first. Empty array if the search names nothing that exists.",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Official name of the institution." },
          city: { type: "STRING", description: "City the main campus is in." },
          subdivision: {
            type: "STRING",
            description: "State, province, or region.",
          },
          countryCode: {
            type: "STRING",
            description: "ISO 3166-1 alpha-2 country code of the institution, e.g. US, GB, JP.",
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
          },
          website: { type: "STRING", description: "Homepage URL including https://." },
          programsUrl: {
            type: "STRING",
            description:
              "URL of the page listing all its programs or majors — the index, not a specific program.",
          },
          annualTuitionLow: { type: "NUMBER" },
          annualTuitionHigh: { type: "NUMBER" },
          currency: { type: "STRING", description: "ISO 4217 code for the tuition figures." },
          annualTuitionUsdLow: { type: "NUMBER" },
          annualTuitionUsdHigh: { type: "NUMBER" },
          latitude: { type: "NUMBER", description: "Main campus latitude, decimal degrees." },
          longitude: { type: "NUMBER", description: "Main campus longitude, decimal degrees." },
          note: {
            type: "STRING",
            description:
              "One sentence on what this school offers relevant to the stated career.",
          },
        },
        required: [
          "name",
          "city",
          "subdivision",
          "countryCode",
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
          "note",
        ],
      },
    },
  },
  required: ["matches"],
};

const SYSTEM_PROMPT = `You look up a specific university or college by name, anywhere in the world.

RULES:
- Only return institutions that genuinely exist and currently enrol students. If the search matches nothing real, return an empty array. An empty result is a fine answer; an invented school is not.
- Return up to 3 candidates when the name is genuinely ambiguous — "Cambridge" is two famous universities on two continents, "Trinity" is several. Best or most likely match first.
- Return exactly one when the name is unambiguous.
- Do NOT pad the list. If only one real school matches, return one.

COORDINATES drop a pin on a map, so an error is immediately visible. Give the main campus if you know it, otherwise the centre of the city you named.

URLS are fetched and checked by our server. programsUrl must be a page that LISTS programs — a course finder or academic catalogue — not a specific program page and not the homepage. Prefer a stable URL you're sure of over a precise-looking one you're guessing at.

TUITION should be annual tuition and fees for a domestic undergraduate, in the school's own currency, plus a USD conversion so schools in different countries can be compared.

Return only JSON matching the schema.`;

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { query, career } = await request.json();

    const search = String(query ?? "").trim();
    if (search.length < 3) {
      return NextResponse.json(
        { error: "Type at least three characters to search for a school." },
        { status: 400 }
      );
    }
    if (search.length > MAX_CAREER_INPUT) {
      return NextResponse.json(
        { error: "That's too long to be a school name." },
        { status: 400 }
      );
    }

    // `career` reaches the prompt verbatim below and, unlike every other route,
    // never passes through resolveCareer — so it needs both checks written out
    // here. It was previously interpolated with no type check at all, which
    // made it the one field where anything at all could be put in front of the
    // model.
    if (career !== undefined && typeof career !== "string") {
      return NextResponse.json(
        { error: "Career must be a string." },
        { status: 400 }
      );
    }
    if (typeof career === "string") {
      if (career.length > MAX_CAREER_INPUT) {
        return NextResponse.json({ error: TOO_LONG_MESSAGE }, { status: 400 });
      }
      if (blockedCareer(normalizeCareer(career))) {
        return NextResponse.json(
          { error: BLOCKED_CAREER_MESSAGE, blocked: true },
          { status: 400 }
        );
      }
    }

    // Keyed on the search text alone, not the career: the school's location,
    // URLs, and tuition don't change with what the student wants to study.
    // Only `note` does, and a slightly generic note is a fair price for one
    // cache entry per school instead of one per school-and-career pair.
    const key = cacheKey("school-lookup", search.toLowerCase());

    const cached = getCached<SchoolRef[]>(key);
    if (cached) return NextResponse.json({ matches: cached });

    const durable = await getDurable<SchoolRef[]>(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json({ matches: durable });
    }

    const limited = enforceGenerationLimits(request);
    if (limited) return limited;
    recordGeneration();
    logCacheMiss("schools", `lookup: ${search}`);

    const result = await generateJson<{ matches: any[] }>({
      apiKey,
      systemPrompt: SYSTEM_PROMPT,
      userQuery: `Find the institution a student means by "${search}".${
        career ? ` They want to become a "${career}", so note what it offers for that.` : ""
      }`,
      responseSchema: RESPONSE_SCHEMA,
      // Recall, not composition. Sampling here invents universities.
      temperature: 0.1,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const matches: SchoolRef[] = (result.data.matches ?? [])
      .filter((entry) => entry?.name)
      .slice(0, 3)
      .map((entry) => {
        const latitude = Number(entry.latitude);
        const longitude = Number(entry.longitude);
        const placed = hasUsableCoordinates({ latitude, longitude });

        return {
          id: openSchoolId(entry.name),
          name: entry.name,
          city: entry.city ?? "",
          subdivision: entry.subdivision ?? "",
          countryCode: String(entry.countryCode ?? "").toUpperCase(),
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
          latitude: placed ? latitude : undefined,
          longitude: placed ? longitude : undefined,
          // Left null on purpose. The caller knows where the student is and
          // measures it there, the same way find-schools does — a distance
          // stored here would be measured from nowhere.
          distanceMiles: null,
          note: entry.note || "",
        } satisfies SchoolRef;
      });

    // Don't cache an empty result: a typo today shouldn't permanently teach us
    // that a real school doesn't exist.
    if (matches.length) {
      setCached(key, matches);
      await setDurable(key, matches);
    }

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error("Error looking up school:", error);
    return NextResponse.json(
      { error: "Failed to look up that school." },
      { status: 500 }
    );
  }
}
