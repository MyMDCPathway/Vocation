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
import { openSchoolId, type SchoolRef } from "@/app/lib/schoolRef";

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
          "distanceNote",
          "note",
        ],
      },
    },
  },
  required: ["schools"],
};

const SYSTEM_PROMPT = `You identify real universities and colleges that could realistically lead a student to a specific career, given where they live.

HARD RULES:
- Every institution must genuinely exist and currently enrol students. Never invent a school, and never merge two real schools into one name.
- Include a school ONLY if it plausibly offers education relevant to the stated career. A polytechnic with no medical faculty is not an answer for someone who wants to be a doctor.
- Prefer institutions in or near the stated city. Include the nearest realistic options even if that means a neighbouring city or region, and say so in distanceNote.
- Give a mix where one exists: cheaper public options AND stronger-reputation options, so the student can see the trade. Do not return six near-identical private universities.

URLS — these are checked:
- website must be the institution's real homepage.
- programsUrl must be a real page that LISTS programs (a course finder, a majors index, an academic catalogue). Not a specific program page, not the homepage, not a search results URL with query parameters.
- If you are not confident a specific URL is correct, give the homepage for website and the closest thing to a program index you are confident about for programsUrl. A URL we can fetch matters more than a URL that looks precise.

TUITION:
- Quote annual tuition and fees for a domestic undergraduate student, in the school's own currency.
- Also convert to USD so schools in different countries can be compared.
- These are estimates and will be labelled as such, but they must be in the right order of magnitude — the difference between a €200/year public university and a $60,000/year private one is the single most useful thing here.

Return only JSON matching the schema.`;

function catalogSchoolsFor(city: string, career: string): SchoolRef[] {
  // Rank Florida's real schools by distance from the named city, when we can
  // place that city. We only hold coordinates for school campuses, so the
  // student's city is located by matching it against the schools' own cities —
  // enough to tell "Miami" from "Pensacola", which is all the ranking needs.
  const normalized = city.trim().toLowerCase();
  const anchor = FLORIDA_SCHOOLS.find(
    (school) => school.city.toLowerCase() === normalized
  );
  const origin = anchor ? SCHOOL_COORDINATES[anchor.id] : undefined;

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
        note: "We hold this school's full program catalog, so its plan is built from real programs rather than estimated.",
      } satisfies SchoolRef;
    })
    .sort((a, b) => {
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });
}

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { career, countryCode, subdivision, city } = await request.json();

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

    // Catalog schools are free and deterministic, so they're assembled outside
    // the cache and merged onto whatever the AI half returns.
    const catalog = hasLocalCatalogs(countryCode, subdivision)
      ? catalogSchoolsFor(String(city ?? ""), canonicalCareer)
      : [];

    const key = cacheKey(
      "schools",
      `${countryCode}|${subdivision ?? ""}|${city ?? ""}|${canonicalCareer}`
    );

    const cached = getCached<SchoolRef[]>(key);
    if (cached) {
      return NextResponse.json({ schools: [...catalog, ...cached] });
    }

    const durable = await getDurable<SchoolRef[]>(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json({ schools: [...catalog, ...durable] });
    }

    const limited = enforceGenerationLimits(request);
    if (limited) return limited;
    recordGeneration();
    logCacheMiss("schools", `${place} / ${career}`, canonicalCareer);

    const result = await generateJson<{ schools: any[] }>({
      apiKey,
      systemPrompt: SYSTEM_PROMPT,
      userQuery: `A student living in ${place || countryName(countryCode)}, ${countryName(
        countryCode
      )} wants to become a "${canonicalCareer}".

List real institutions in or near ${place || countryName(countryCode)} that could get them there, with the URLs and tuition figures the schema asks for.${
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
        return NextResponse.json({ schools: catalog, partial: true });
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
        distanceMiles: null,
        note: [entry.note, entry.distanceNote].filter(Boolean).join(" · "),
      }));

    if (discovered.length) {
      setCached(key, discovered);
      await setDurable(key, discovered);
    }

    return NextResponse.json({ schools: [...catalog, ...discovered] });
  } catch (error: any) {
    console.error("Error finding schools:", error);
    return NextResponse.json(
      { error: "Failed to find schools for that location." },
      { status: 500 }
    );
  }
}
