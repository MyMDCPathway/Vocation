import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { enforceGenerationLimits, recordGeneration } from "@/app/lib/rateLimit";
import { generateJson } from "@/app/lib/geminiJson";
import { logCacheMiss } from "@/app/lib/missLog";
import { getCountry, subdivisionLabel } from "@/app/lib/countries";

// The states, provinces, prefectures and counties of one country.
//
// This is AI-sourced rather than a shipped table, which is a deliberate call.
// Hand-typing ISO 3166-2 for 190 countries is ~5,000 rows I would be entering
// from memory, and a wrong or missing subdivision is invisible until a student
// from that region can't find where they live. Subdivisions are also stable,
// famous, closed lists — the thing a language model is most reliable at.
//
// The cost argument is that there isn't one: there are fewer than 200 possible
// requests here in total, they never change, and all three cache layers apply.
// After a country has been asked for once it is free forever.

const apiKey = process.env.GEMINI_API_KEY;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    subdivisions: {
      type: "ARRAY",
      description:
        "Every first-level administrative subdivision of the country, in the order a local would expect (alphabetical unless there's a strong convention otherwise).",
      items: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description: "The subdivision's common English name, e.g. 'California', 'Ontario', 'Bavaria'.",
          },
          largestCities: {
            type: "ARRAY",
            description: "3-6 of its largest or best-known cities, largest first.",
            items: { type: "STRING" },
          },
        },
        required: ["name", "largestCities"],
      },
    },
  },
  required: ["subdivisions"],
};

const SYSTEM_PROMPT = `You list the first-level administrative subdivisions of a country, and the main cities inside each one.

Rules:
- List ALL first-level subdivisions. Do not truncate a long list — the United States has 50 states plus DC, Japan has 47 prefectures, France has 18 regions including overseas ones.
- Use the common English name a resident would recognise, not the ISO code and not a transliteration nobody uses.
- For each subdivision give 3-6 real cities inside it, largest first. These are used to help someone say where they live, so prefer places people actually live over administrative seats nobody has heard of.
- If a country genuinely has no meaningful first-level subdivisions (a city-state, a very small island nation), return a single entry named after the country itself with its main cities.

Return only JSON matching the schema.`;

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { countryCode } = await request.json();

    const country = getCountry(String(countryCode ?? ""));
    if (!country) {
      return NextResponse.json(
        { error: "A known ISO 3166-1 alpha-2 country code is required." },
        { status: 400 }
      );
    }

    const key = cacheKey("regions", country.code);

    const cached = getCached(key);
    if (cached) return NextResponse.json(cached);

    const durable = await getDurable(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json(durable);
    }

    // Past the cache this spends a Gemini request, so the limits start here —
    // same pipeline order as every other route.
    const limited = enforceGenerationLimits(request);
    if (limited) return limited;
    recordGeneration();
    logCacheMiss("regions", country.name, country.code);

    const result = await generateJson<{
      subdivisions: { name: string; largestCities: string[] }[];
    }>({
      apiKey,
      systemPrompt: SYSTEM_PROMPT,
      userQuery: `List the ${subdivisionLabel(country.code).toLowerCase()}s of ${country.name} (${country.code}), with their main cities.`,
      responseSchema: RESPONSE_SCHEMA,
      // Factual recall, not composition. Sampling here invents provinces.
      temperature: 0,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const subdivisions = (result.data.subdivisions ?? []).filter(
      (entry) => entry?.name
    );

    if (!subdivisions.length) {
      // Caching an empty list would make the failure permanent for that
      // country. Fail open so the next request retries.
      return NextResponse.json(
        { error: `We couldn't load regions for ${country.name}.` },
        { status: 502 }
      );
    }

    const payload = {
      countryCode: country.code,
      label: subdivisionLabel(country.code),
      subdivisions,
    };

    setCached(key, payload);
    await setDurable(key, payload);

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Error loading regions:", error);
    return NextResponse.json(
      { error: "Failed to load regions for that country." },
      { status: 500 }
    );
  }
}
