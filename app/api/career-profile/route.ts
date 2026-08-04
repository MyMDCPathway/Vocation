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
import { matchOccupation, type OccupationMatch } from "@/app/lib/blsOccupations";
import { resolveAreas, type ResolvedAreas } from "@/app/lib/blsAreas";
import { fetchLaborStats, type LaborStats } from "@/app/lib/blsStats";
import { discussionVenues } from "@/app/lib/careerVoices";
import type {
  CareerProfile,
  CareerResource,
  StatsStatus,
} from "@/app/lib/careerProfileTypes";

// Everything worth knowing about a job before committing years to it.
//
// Four sources, each doing what it's actually good at:
//
//   BLS         what the job PAYS and how many people do it, nationally, in
//               the student's state, and in their metro. Real survey results,
//               not estimates — see blsStats.ts.
//   Gemini      what the work is, what the route in looks like, what people
//               in it say about it, and WHICH resources and Wikipedia
//               articles to go and get.
//   Our server  fetching every resource URL it named, and dropping the ones
//               that don't resolve. Same principle as the program links.
//   Wikipedia   the photographs, with their licences. The model is never
//               asked for an image URL — see careerPhotos.ts for why.
//
// WHERE THE LINE IS. Pay and employment come from BLS whenever the career
// matches a real occupation and the student is in the US. Everywhere else they
// come from the model, and the page says which it's looking at. That
// distinction is the whole point of the BLS work: a sourced figure and a
// guessed one look identical on screen unless something says otherwise.
//
// The whole thing caches as one object, so the Gemini call, the BLS requests,
// the six link probes, and the three Wikimedia requests are paid once per
// career per area.

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
      enum: ["Growing fast", "Steady demand", "Shrinking"],
      description:
        "Whether the WORK is growing. Use 'Shrinking' when the occupation is genuinely contracting. This is about employer need only — how hard it is to get hired is a separate field, so do not downgrade a growing field because it is crowded.",
    },
    demandDetail: {
      type: "STRING",
      description:
        "One or two sentences on WHY demand looks like that — what's driving it, and where the jobs actually are.",
    },
    competitionLevel: {
      type: "STRING",
      enum: ["Wide open", "Manageable", "Competitive", "Extremely competitive"],
      description:
        "How hard it is to actually GET one of those jobs. Use 'Extremely competitive' when qualified applicants vastly outnumber posts and people apply for months without an interview. A field can be growing and still extremely competitive to enter — say so when it is. Do not flatter the job.",
    },
    competitionDetail: {
      type: "STRING",
      description:
        "One or two sentences on what the queue in front of this job actually looks like — who you are up against, and what gets people picked.",
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
    socCode: {
      type: "STRING",
      description:
        "The US Standard Occupational Classification code for this job, six digits with a hyphen, e.g. '29-1141' for registered nurses. Give the DETAILED occupation code, not a family like '29-0000'. If you are not confident of the exact code, return an empty string — a wrong code produces an authoritative-looking wage table for a different job.",
    },
    typicalPath: {
      type: "ARRAY",
      description:
        "The usual route into this job, 3-5 stages in order, from where someone starts to working in the role. Describe the ROUTE MOST PEOPLE ACTUALLY TAKE, not the fastest theoretical one or an unusual shortcut.",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "The stage, e.g. 'Associate degree in nursing'." },
          detail: { type: "STRING", description: "One sentence on what happens in this stage." },
          duration: { type: "STRING", description: "How long it takes, e.g. '2 years', '6-12 months'." },
        },
        required: ["label", "detail", "duration"],
      },
    },
    voices: {
      type: "ARRAY",
      description:
        "3-5 themes that RECUR when people who actually do this job talk about it — on Reddit, in employer reviews, in professional forums. Summarise the recurring theme; do NOT invent or reproduce quotes. Include the complaints: burnout, pay ceilings, unpaid overtime, difficult clients, the parts nobody warns students about. A list of only good things is a lie a student pays for later.",
      items: {
        type: "OBJECT",
        properties: {
          theme: { type: "STRING", description: "Short heading, e.g. 'The paperwork is most of the job'." },
          tone: {
            type: "STRING",
            enum: ["reward", "tradeoff", "warning"],
            description:
              "'reward' is why people stay, 'tradeoff' is a real cost they accept, 'warning' is what makes people leave the field.",
          },
          detail: { type: "STRING", description: "One or two sentences on what people report." },
        },
        required: ["theme", "tone", "detail"],
      },
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
    "competitionLevel",
    "competitionDetail",
    "payLow",
    "payMedian",
    "payHigh",
    "payCurrency",
    "payNote",
    "entryRoute",
    "timeToEntry",
    "typicalPath",
    "voices",
    "relatedCareers",
    "wikipediaTitles",
    "resources",
  ],
};

function systemPrompt(market: string): string {
  return `You brief someone on a career before they commit years of their life and a lot of money to it.

Write for a student who may be the first person in their family to consider this job. Assume no inside knowledge and no jargon.

BE HONEST ABOUT THE UNGLAMOROUS PARTS. A career page that only lists upsides is worse than useless — the student finds out the truth after they've paid for two years of study. If a field is oversubscribed, say so. If the advertised salary only applies to a small senior minority, say so in payNote. If most entry-level work is in places people don't want to move to, that belongs in demandDetail.

DEMAND AND COMPETITION ARE TWO DIFFERENT QUESTIONS and the student needs both answers. Demand is whether employers need this work done. Competition is whether they would pick this particular applicant out of the pile. Software engineering in a layoff year is steady demand and extremely competitive at entry; a rural nursing shortage is growing demand and wide open. Answer each on its own terms — collapsing them into one verdict is how a page ends up telling someone a crowded field is a safe bet.

PAY: give figures for ${market}, in that market's own currency. Low is what someone actually starts on, not the theoretical floor. High is what an experienced practitioner makes, not the outlier. For US careers your figures may be replaced by the official Bureau of Labor Statistics survey — give your honest best estimate anyway, since it is what a student outside the US or in an unsurveyed occupation will see.

VOICES: summarise what people who do this job recurringly say about it, the way it comes up in forums and employer reviews. Themes, not quotes — never write anything in quotation marks and never attribute anything to a named person. The point of this section is the things a careers brochure leaves out, so at least one entry should be something that makes people leave the field.

TYPICAL PATH: the route most people actually take, in order, with honest durations. If most people take a year out between two stages, that is part of the path.

RESOURCES: our server fetches every URL you give and silently drops any that fail, so the student sees only working links. That makes a stable top-level URL you're sure of far more valuable than a precise-looking deep link you're guessing at. Prefer the organisation's homepage over a subpage.

WIKIPEDIA TITLES: give the actual article titles, best match first. These pull the photographs, so prefer the article about the OCCUPATION or its FIELD over an abstract concept — "Marine biology" over "Ocean", "Welder" over "Welding technology".

Respond only with JSON matching the schema.`;
}

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { career, countryCode, subdivision, city } = await request.json();

    if (!career || typeof career !== "string" || !career.trim()) {
      return NextResponse.json(
        { error: "A career is required." },
        { status: 400 }
      );
    }

    const canonicalCareer = resolveCareer(career).canonical;

    // The location step runs before this one, so the country is normally
    // known. The market is named on the page either way, so a student in
    // Manchester reading US figures can at least see that's what they are.
    const country = typeof countryCode === "string" ? getCountry(countryCode) : undefined;
    const market = country ? countryName(country.code) : "the United States";

    // Null outside the US — BLS surveys US establishments only.
    const areas = resolveAreas({
      countryCode: typeof countryCode === "string" ? countryCode : "",
      subdivision: typeof subdivision === "string" ? subdivision : "",
      city: typeof city === "string" ? city : "",
    });

    // The area belongs in the key because the metro figures differ by it —
    // without this, the first student to look up "nurse" would hand their
    // Miami wages to the next one in Seattle. Falls back to the country when
    // there's no US area, which is the pre-BLS behaviour.
    const areaKey = areas
      ? `${areas.metro?.code ?? areas.state?.code ?? "us"}`
      : (country?.code ?? "default");
    const key = cacheKey("profile", `${canonicalCareer}|${areaKey}`);

    const cached = getCached<CareerProfile>(key);
    if (cached) return NextResponse.json(await healStats(cached, areas, key));

    const durable = await getDurable<CareerProfile>(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json(await healStats(durable, areas, key));
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

    // Check the links, pull the photos, and ask BLS all at the same time —
    // none depends on the others, and serially they'd add several seconds to a
    // page the student is sitting in front of.
    const proposed: CareerResource[] = (data.resources ?? []).filter(
      (r: any) => r?.url && r?.label
    );

    // The model's SOC code is a hint, not an answer: matchOccupation only uses
    // it if BLS actually publishes that code, so a hallucinated one costs us
    // precision rather than correctness. See blsOccupations.ts.
    const occupation = areas
      ? matchOccupation(canonicalCareer, typeof data.socCode === "string" ? data.socCode : undefined)
      : null;

    const [resources, media, stats] = await Promise.all([
      verifyResources(proposed),
      fetchCareerMedia(data.wikipediaTitles ?? []),
      occupation && areas ? fetchLaborStats(occupation, areas) : Promise.resolve(null),
    ]);

    const profile: CareerProfile = {
      career: canonicalCareer,
      summary: data.summary ?? "",
      dayToDay: (data.dayToDay ?? []).filter(Boolean),
      demand: {
        level: data.demandLevel ?? "Steady demand",
        detail: data.demandDetail ?? "",
      },
      // Left undefined rather than defaulted when the model didn't answer:
      // "Competitive" is a claim about the job market, and a placeholder one
      // is indistinguishable on screen from a real one.
      competition: data.competitionLevel
        ? {
            level: data.competitionLevel,
            detail: data.competitionDetail ?? "",
          }
        : undefined,
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
      typicalPath: (data.typicalPath ?? []).filter((s: any) => s?.label),
      voices: (data.voices ?? []).filter((v: any) => v?.theme && v?.detail),
      venues: discussionVenues(canonicalCareer),
      stats,
      statsStatus: statusFor(areas, occupation, stats),
      socCode: occupation?.code,
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

/** Which of the four stats situations this profile ended up in. */
function statusFor(
  areas: ResolvedAreas | null,
  occupation: OccupationMatch | null,
  stats: LaborStats | null
): StatsStatus {
  if (!areas) return "outside-us";
  if (!occupation) return "unmatched";
  return stats ? "ok" : "unavailable";
}

/**
 * Re-attempt the figures for a profile that was cached during a BLS outage.
 *
 * Without this, one exhausted rate limit poisons a career for as long as the
 * cache lives: the model call succeeded, so the profile is stored and served
 * forever with no wage data and a note explaining an absence that isn't real.
 *
 * Only the BLS half is retried — the expensive part is the model call, and it
 * doesn't need repeating. Anything other than "unavailable" is a settled
 * answer and is returned untouched.
 */
async function healStats(
  profile: CareerProfile,
  areas: ResolvedAreas | null,
  key: string
): Promise<CareerProfile> {
  if (profile.statsStatus !== "unavailable" || !areas || !profile.socCode) {
    return profile;
  }

  const occupation = matchOccupation(profile.career, profile.socCode);
  if (!occupation) return profile;

  const stats = await fetchLaborStats(occupation, areas);
  if (!stats) return profile;

  const healed: CareerProfile = { ...profile, stats, statsStatus: "ok" };
  setCached(key, healed);
  await setDurable(key, healed);
  return healed;
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
