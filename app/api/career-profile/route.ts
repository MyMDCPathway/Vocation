import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { enforceGenerationLimits, recordGeneration } from "@/app/lib/rateLimit";
import { generateJson } from "@/app/lib/geminiJson";
import { logCacheMiss } from "@/app/lib/missLog";
import { resolveCareer } from "@/app/lib/careerCanonical";
import { countryName, getCountry } from "@/app/lib/countries";
import { fetchCareerMedia } from "@/app/lib/careerPhotos";
import { probeUrl } from "@/app/lib/urlVerify";
import type { CareerProfile, CareerResource } from "@/app/lib/careerProfileTypes";

// Everything worth knowing about a job before committing years to it.
//
// Three sources, each doing what it's actually good at:
//
//   Gemini      what the work is, what it pays, whether anyone's hiring, and
//               WHICH resources and Wikipedia articles to go and get.
//   Our server  fetching every resource URL it named, and dropping the ones
//               that don't resolve. Same principle as the program links.
//   Wikipedia   the photographs, with their licences. The model is never
//               asked for an image URL — see careerPhotos.ts for why.
//
// The whole thing caches as one object, so the Gemini call, the six link
// probes, and the three Wikimedia requests are paid once per career.

const apiKey = process.env.GEMINI_API_KEY;

// Resource probes run in parallel and are the slowest part of a cache miss.
const RESOURCE_CONCURRENCY = 6;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: {
      type: "STRING",
      description:
        "Two or three sentences on what this job actually is, written for someone who has never met anyone who does it. Concrete, not aspirational.",
    },
    dayToDay: {
      type: "ARRAY",
      description: "3-5 things a person in this job actually does in a normal week.",
      items: { type: "STRING" },
    },
    demandLevel: {
      type: "STRING",
      enum: ["Growing fast", "Steady demand", "Competitive", "Shrinking"],
      description:
        "Honest assessment of hiring. Use 'Competitive' when there are more qualified applicants than posts, and 'Shrinking' when the occupation is genuinely contracting. Do not flatter the job.",
    },
    demandDetail: {
      type: "STRING",
      description:
        "One or two sentences on WHY demand looks like that — what's driving it, and where the jobs actually are.",
    },
    payLow: { type: "NUMBER", description: "Typical starting salary, annual." },
    payMedian: { type: "NUMBER", description: "Median annual salary." },
    payHigh: { type: "NUMBER", description: "Typical experienced/senior annual salary." },
    payCurrency: { type: "STRING", description: "ISO 4217 code for the figures above." },
    payNote: {
      type: "STRING",
      description:
        "One sentence on what drives the spread — specialty, region, sector, seniority.",
    },
    entryRoute: {
      type: "STRING",
      description: "The usual way people get into this job, in one sentence.",
    },
    timeToEntry: {
      type: "STRING",
      description:
        "How long from starting study to working in the role, e.g. '2 years' or '10-14 years'.",
    },
    relatedCareers: {
      type: "ARRAY",
      description:
        "3-5 genuinely adjacent jobs someone considering this one should know about — similar skills or similar training, not just the same field.",
      items: { type: "STRING" },
    },
    wikipediaTitles: {
      type: "ARRAY",
      description:
        "2-3 English Wikipedia article titles for this occupation or its field, best first, exactly as Wikipedia titles them (e.g. 'Marine biology', 'Registered nurse'). Used to pull photographs and a description.",
      items: { type: "STRING" },
    },
    resources: {
      type: "ARRAY",
      description:
        "4-6 genuinely useful links: the professional body, the licensing authority, official pay/outlook data, an active community. EVERY URL IS FETCHED AND CHECKED by our server — a dead one is dropped and the student never sees it, so give real, stable, top-level URLs rather than deep links you're unsure of.",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Name of the organisation or resource." },
          url: { type: "STRING", description: "Full URL including https://." },
          kind: {
            type: "STRING",
            enum: ["professional-body", "licensing", "data", "community", "reading"],
          },
          detail: { type: "STRING", description: "One short line on why it's worth opening." },
        },
        required: ["label", "url", "kind", "detail"],
      },
    },
  },
  required: [
    "summary",
    "dayToDay",
    "demandLevel",
    "demandDetail",
    "payLow",
    "payMedian",
    "payHigh",
    "payCurrency",
    "payNote",
    "entryRoute",
    "timeToEntry",
    "relatedCareers",
    "wikipediaTitles",
    "resources",
  ],
};

function systemPrompt(market: string): string {
  return `You brief someone on a career before they commit years of their life and a lot of money to it.

Write for a student who may be the first person in their family to consider this job. Assume no inside knowledge and no jargon.

BE HONEST ABOUT THE UNGLAMOROUS PARTS. A career page that only lists upsides is worse than useless — the student finds out the truth after they've paid for two years of study. If a field is oversubscribed, say so. If the advertised salary only applies to a small senior minority, say so in payNote. If most entry-level work is in places people don't want to move to, that belongs in demandDetail.

PAY: give figures for ${market}, in that market's own currency. Low is what someone actually starts on, not the theoretical floor. High is what an experienced practitioner makes, not the outlier.

RESOURCES: our server fetches every URL you give and silently drops any that fail, so the student sees only working links. That makes a stable top-level URL you're sure of far more valuable than a precise-looking deep link you're guessing at. Prefer the organisation's homepage over a subpage.

WIKIPEDIA TITLES: give the actual article titles, best match first. These pull the photographs, so prefer the article about the OCCUPATION or its FIELD over an abstract concept — "Marine biology" over "Ocean", "Welder" over "Welding technology".

Respond only with JSON matching the schema.`;
}

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { career, countryCode } = await request.json();

    if (!career || typeof career !== "string" || !career.trim()) {
      return NextResponse.json(
        { error: "A career is required." },
        { status: 400 }
      );
    }

    const canonicalCareer = resolveCareer(career).canonical;

    // The profile is asked for BEFORE the location question, so usually there
    // is no country yet. The market is named on the page either way, so a
    // student in Manchester reading US figures can at least see that's what
    // they are.
    const country = typeof countryCode === "string" ? getCountry(countryCode) : undefined;
    const market = country ? countryName(country.code) : "the United States";

    const key = cacheKey("profile", `${canonicalCareer}|${country?.code ?? "default"}`);

    const cached = getCached<CareerProfile>(key);
    if (cached) return NextResponse.json(cached);

    const durable = await getDurable<CareerProfile>(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json(durable);
    }

    const limited = enforceGenerationLimits(request);
    if (limited) return limited;
    recordGeneration();
    logCacheMiss("profile", career, canonicalCareer);

    const result = await generateJson<any>({
      apiKey,
      systemPrompt: systemPrompt(market),
      userQuery: `Brief a student on becoming a "${canonicalCareer}". Pay figures for ${market}.`,
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.3,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const data = result.data;

    // Check the links and pull the photos at the same time — neither depends
    // on the other, and serially they'd add several seconds to a page the
    // student is sitting in front of.
    const proposed: CareerResource[] = (data.resources ?? []).filter(
      (r: any) => r?.url && r?.label
    );

    const [resources, media] = await Promise.all([
      verifyResources(proposed),
      fetchCareerMedia(data.wikipediaTitles ?? []),
    ]);

    const profile: CareerProfile = {
      career: canonicalCareer,
      summary: data.summary ?? "",
      dayToDay: (data.dayToDay ?? []).filter(Boolean),
      demand: {
        level: data.demandLevel ?? "Steady demand",
        detail: data.demandDetail ?? "",
      },
      pay: {
        low: Number(data.payLow) || 0,
        median: Number(data.payMedian) || 0,
        high: Number(data.payHigh) || 0,
        currency: data.payCurrency || "USD",
        market,
        note: data.payNote ?? "",
      },
      entryRoute: data.entryRoute ?? "",
      timeToEntry: data.timeToEntry ?? "",
      relatedCareers: (data.relatedCareers ?? []).filter(Boolean),
      resources,
      droppedResources: proposed.length - resources.length,
      article: media.article,
      photos: media.photos,
    };

    setCached(key, profile);
    await setDurable(key, profile);

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("Error building career profile:", error);
    return NextResponse.json(
      { error: "Failed to load information about that career." },
      { status: 500 }
    );
  }
}

/**
 * Keep only the resources whose page actually loads.
 *
 * Dropping rather than falling back, unlike program links: a program has a
 * sensible fallback (the school's course index), whereas a dead link to a
 * licensing board has nowhere to degrade to. Rule 7 — prefer no link over a
 * wrong one — so it goes, and the count of what went is reported.
 */
async function verifyResources(proposed: CareerResource[]): Promise<CareerResource[]> {
  const kept: (CareerResource | null)[] = new Array(proposed.length).fill(null);
  let cursor = 0;

  const worker = async () => {
    while (cursor < proposed.length) {
      const index = cursor++;
      const resource = proposed[index];
      const probe = await probeUrl(resource.url);
      if (probe.ok) {
        kept[index] = { ...resource, url: probe.finalUrl ?? resource.url };
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(RESOURCE_CONCURRENCY, proposed.length) }, worker)
  );

  return kept.filter((r): r is CareerResource => r !== null);
}
