import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { resolveCareer } from "@/app/lib/careerCanonical";
import {
  BLOCKED_CAREER_MESSAGE,
  MAX_CAREER_INPUT,
  TOO_LONG_MESSAGE,
} from "@/app/lib/careerPolicy";
import { enforceGenerationLimits, recordGeneration } from "@/app/lib/rateLimit";
import { geminiUrl } from "@/app/lib/geminiModel";
import { logCacheMiss } from "@/app/lib/missLog";
import { archetypeProfile } from "@/app/lib/routeArchetype";

// Step two of the 2.0 intake: "you said doctor — what kind?"
//
// The interesting half of this route is knowing when NOT to ask. "BCBA" is
// already a specific credential with one training route; asking a student who
// typed it to narrow it further is a dead click that makes the product feel
// like a form. "Doctor" genuinely can't be planned without knowing the
// specialty, because the residency length and the licensing exams differ.
//
// So the model's first job is a judgment call — is this specific enough to
// plan against? — and only then does it produce options. That flag is what
// lets the wizard skip the whole step.
//
// This costs one Gemini call per distinct career, cached exactly like the
// other routes, so the common careers converge on free after first use.

const apiKey = process.env.GEMINI_API_KEY;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    legitimate: {
      type: "BOOLEAN",
      description:
        "False when this is not a lawful occupation we should be building an education plan for. True for every real job, including unglamorous, dangerous, and poorly paid ones.",
    },
    needsSpecifics: {
      type: "BOOLEAN",
      description:
        "False when the input already names one specific job with a single training route (e.g. BCBA, Dental Hygienist, Air Traffic Controller). True only when the answer would materially change the education plan.",
    },
    question: {
      type: "STRING",
      description:
        "The follow-up question to ask, phrased conversationally in the second person. Empty string when needsSpecifics is false.",
    },
    helpText: {
      type: "STRING",
      description:
        "One short sentence explaining why the answer changes the plan. Empty string when needsSpecifics is false.",
    },
    options: {
      type: "ARRAY",
      description:
        "3-6 concrete answers to the question. Empty array when needsSpecifics is false.",
      items: {
        type: "OBJECT",
        properties: {
          label: {
            type: "STRING",
            description: "The specific job title or option, e.g. 'Pediatrician', 'Point Guard', 'U.S. Army'.",
          },
          detail: {
            type: "STRING",
            description: "One sentence on what this option actually involves.",
          },
          commitment: {
            type: "STRING",
            description:
              "The headline difference in training, e.g. '4 years med school + 3-year residency' or '4-year enlistment'. Keep under 60 characters.",
          },
        },
        required: ["label", "detail", "commitment"],
      },
    },
    routeArchetype: {
      type: "STRING",
      enum: [
        "degree",
        "credential",
        "apprenticeship",
        "certification",
        "enlistment",
        "talent",
        "direct-entry",
      ],
      description:
        "How people ACTUALLY get into this job — see the classification rules. This decides whether the student is shown universities, union halls, certification bodies, or recruiters, so it must reflect the real dominant route rather than the most prestigious one.",
    },
    routeReason: {
      type: "STRING",
      description:
        "One short sentence on why that is the route, naming the actual gate — the licence, the union, the exam, the audition. Shown to the student.",
    },
    outline: {
      type: "ARRAY",
      description:
        "4-6 steps from where someone starts to actually working in this job. This is shown to the student immediately and stays on screen for the rest of the intake, so it must match the route archetype — an apprenticeship outline does not begin with a degree.",
      items: {
        type: "OBJECT",
        properties: {
          label: {
            type: "STRING",
            description:
              "Short name for the step, under 40 characters. 'Apprenticeship', 'Bachelor's degree', 'NCLEX-RN', 'CDL training'.",
          },
          detail: {
            type: "STRING",
            description: "One sentence on what actually happens at this step.",
          },
          kind: {
            type: "STRING",
            enum: ["education", "training", "credential", "experience", "work"],
            description:
              "education for academic study, training for trade/vocational/on-the-job programs, credential for exams and licences, experience for required hours or placements, work for actually being employed in the role.",
          },
          duration: {
            type: "STRING",
            description:
              "Rough time this step takes, e.g. '4 years', '6-12 months'. Empty string if it isn't time-bounded.",
          },
          clearedBy: {
            type: "STRING",
            enum: [
              "in-high-school",
              "hs-diploma",
              "some-college",
              "associate",
              "bachelor",
              "graduate",
            ],
            description:
              "The education level that makes this step ALREADY DONE. Set it only for steps a student could genuinely have completed already — a bachelor's step is clearedBy 'bachelor'. Omit for anything that can't be skipped by prior education, such as an apprenticeship, a licensing exam, or supervised hours.",
          },
        },
        required: ["label", "detail", "kind", "duration"],
      },
    },
  },
  required: [
    "legitimate",
    "needsSpecifics",
    "question",
    "helpText",
    "options",
    "routeArchetype",
    "routeReason",
    "outline",
  ],
};

const SYSTEM_PROMPT = `You are a career advisor helping a student turn a rough idea into a plannable goal.

You will be given what a student typed as the career they want.

BEFORE ANYTHING ELSE — set legitimate.

Set legitimate to false only when the input names something we should not be writing an education plan for at all: contract violence, illegal drug trade, human trafficking, commercial sexual services, or fraud and theft as the occupation itself. Set it to false for phrasings that mean those things without naming them plainly.

Set legitimate to TRUE for everything else, and read that literally. Dangerous jobs, dirty jobs, badly paid jobs, jobs with no formal training, jobs you personally would not recommend, and jobs adjacent to crime but on the right side of it — police officer, prison guard, bail bondsman, criminal defence lawyer, forensic toxicologist, drug and alcohol counsellor, ethical hacker, penetration tester, anti-money-laundering analyst, bartender, tattoo artist, mortician, exterminator, oil rig worker, professional gambler — are all real occupations and all get true. Wrongly refusing a student's actual career is a worse failure than any of the rest of this response, and it is the failure this field most easily causes. When you are unsure, the answer is true.

When legitimate is false, nothing else in the response is read: return false, an empty question, an empty helpText, an empty options array, 'direct-entry', an empty routeReason, and an empty outline.

Then decide ONE thing: is this specific enough to build an education plan around?

ALREADY SPECIFIC — set needsSpecifics to false:
- Named credentials with one training route: BCBA, Dental Hygienist, Registered Nurse, CPA, Paralegal, Radiologic Technologist, Air Traffic Controller, Electrician.
- Specific job titles where the degree path doesn't fork: Mechanical Engineer, Elementary School Teacher, Pharmacist, Veterinarian.

NEEDS NARROWING — set needsSpecifics to true:
- Umbrella terms covering jobs with genuinely different training: "doctor" (specialty determines residency length and boards), "lawyer" (practice area determines the degree focus), "engineer" (discipline determines the entire major).
- Fields where the specific role changes everything: "military" (branch), "professional athlete" (sport and position), "artist" (medium), "scientist" (field).

The test is strictly practical: would two different answers produce DIFFERENT degrees, DIFFERENT exams, or DIFFERENT numbers of years? If they'd produce the same plan, it is already specific. Do not ask a question just to seem thorough — a needless question is worse than no question.

When you do ask, the options must be real, distinct jobs a person actually holds, not categories. Order them from most common to least common.

CLASSIFY THE ROUTE — this is the other half of your job.

Set routeArchetype to how people ACTUALLY get into this job today. This decides what the student is shown next: universities, union halls, certification bodies, or a recruiter. Getting it wrong sends a future electrician to look at degree programs.

- degree — a university degree is the genuine gate. Doctor, lawyer, mechanical engineer, teacher, architect, pharmacist.
- credential — a specific licence or accredited program is the gate, usually shorter than a bachelor's and often at a community college. Registered nurse, dental hygienist, radiologic technologist, paralegal, BCBA, EMT.
- apprenticeship — learned on the job, earning while training, typically through a union local or contractor. Electrician, plumber, welder, pipefitter, ironworker, elevator mechanic, HVAC technician.
- certification — hired on demonstrated skill plus industry certifications; a degree is common but not required. Cloud engineer, network administrator, cybersecurity analyst, IT support, web developer.
- enlistment — the route runs through joining the armed forces. Any military role or MOS.
- talent — entry is competitive and gated on ability, audition, portfolio, or scouting rather than credentials. Professional athlete, actor, musician, dancer, model, visual artist.
- direct-entry — you can start with little or no formal training, then progress on the job. Sales rep, truck driver (CDL is short), retail manager, bartender, rideshare driver, warehouse lead.

RULES FOR CLASSIFYING:
1. Choose the DOMINANT real route, not the most prestigious one. Many electricians hold degrees; almost none needed one. Many software developers have CS degrees, but the field hires on demonstrated skill — that is 'certification', not 'degree'.
2. When a career has two genuine routes, choose the one that is cheaper and faster, since that is the one a student is least likely to already know about.
3. 'degree' is the default only when a degree is genuinely required by law, by licensure, or by essentially every employer.

routeReason should name the actual gate in one sentence — "licensed by the state board after an accredited program", "IBEW locals run five-year paid apprenticeships", "hired on portfolio and certifications, not transcripts".

SKETCH THE ROUTE.

outline is 4-6 steps from a standing start to actually doing the job. It is shown to the student straight away and stays beside every remaining question, so it is the first useful thing they get — make it concrete.

- It MUST match the archetype you just chose. An apprenticeship outline starts with getting into an apprenticeship, not with a degree. A talent outline is about development and exposure, not coursework. Contradicting your own classification here is the single worst thing you can do in this response.
- Name real things: the actual licence, the actual exam, the actual union step. "Pass the NCLEX-RN", not "obtain licensure".
- Order them as they actually happen.
- Set clearedBy ONLY where prior education genuinely completes the step. An apprenticeship is not cleared by holding a bachelor's; a bachelor's step is.

Respond only with JSON matching the provided schema.`;

/**
 * Return a cache hit, unless what's stored is a refusal.
 *
 * Refusals share the career's cache key so a repeated attempt costs nothing,
 * which means every read has to tell the two apart. Both cache layers go
 * through here for that reason — the durable layer outlives a deploy, so a
 * refusal written today is still a refusal after the next cold start.
 */
function servedFromCache(entry: unknown): NextResponse {
  if ((entry as { blocked?: boolean })?.blocked) {
    return NextResponse.json(
      { error: BLOCKED_CAREER_MESSAGE, blocked: true },
      { status: 400 }
    );
  }
  return NextResponse.json(entry);
}

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const { career } = await request.json();

    if (!career || typeof career !== "string" || career.trim() === "") {
      return NextResponse.json(
        { error: "Career parameter is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (career.length > MAX_CAREER_INPUT) {
      return NextResponse.json({ error: TOO_LONG_MESSAGE }, { status: 400 });
    }

    // Same canonicalization as every other route, so "RN", "nurse", and "I
    // want to be a nurse" share one answer instead of three.
    const resolved = resolveCareer(career);

    // This is the route the wizard hits FIRST for every career, so refusing
    // here is what stops a blocked search reaching any of the others. Ahead of
    // the cache, the rate limiter, and the model call: it must cost nothing and
    // must not spend the visitor's allowance.
    if (resolved.blocked) {
      return NextResponse.json(
        { error: BLOCKED_CAREER_MESSAGE, blocked: true },
        { status: 400 }
      );
    }

    const canonicalCareer = resolved.canonical;

    // "refine2", not "refine": entries cached before route classification
    // existed have no archetype, and serving one would silently fall back to
    // "degree" — handing a welder a list of universities, which is the exact
    // bug this classification was added to fix. A namespace bump costs one
    // regeneration per career and guarantees every answer carries a route.
    const key = cacheKey("refine2", canonicalCareer);
    const cached = getCached(key);
    if (cached) {
      return servedFromCache(cached);
    }

    const durable = await getDurable(key);
    if (durable) {
      setCached(key, durable);
      return servedFromCache(durable);
    }

    // Limits apply only past the cache, matching the pipeline order the rest
    // of the app depends on — browsing cached careers is never throttled.
    const limited = enforceGenerationLimits(request);
    if (limited) return limited;
    recordGeneration();
    logCacheMiss("refine", career, canonicalCareer);

    const response = await fetch(geminiUrl(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `The student typed: "${canonicalCareer}"\n\nDecide whether this is specific enough to plan an education pathway around, and respond with the JSON schema.`,
              },
            ],
          },
        ],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error (refine-career):", errorText);
      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "The AI service is receiving too many requests right now. Please wait about 30 seconds and try again.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Failed to look up that career due to an external API error." },
        { status: 502 }
      );
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      if (result.promptFeedback) {
        return NextResponse.json(
          { error: `Request blocked: ${result.promptFeedback.blockReason}` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "No candidates returned from API." },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(text);

    // The second pass. The static list in careerPolicy.ts catches the plain
    // spellings; this catches the euphemisms and the phrasings nobody thought
    // to write down, and it costs nothing extra because this call was already
    // being made for every career the wizard sees.
    //
    // The refusal is cached under the same key as a real answer, so a second
    // attempt at the same wording is free rather than billing again. It's
    // stored as a bare marker rather than a Refinement so it can't be mistaken
    // for one — see servedFromCache.
    if (parsed.legitimate === false) {
      const refusal = { blocked: true as const };
      setCached(key, refusal);
      await setDurable(key, refusal);
      return NextResponse.json(
        { error: BLOCKED_CAREER_MESSAGE, blocked: true },
        { status: 400 }
      );
    }

    // A "needs specifics" answer with no options is unusable — the wizard
    // would render an empty question. Downgrade it to "already specific"
    // rather than showing a dead end, since proceeding with what the student
    // typed is always a valid plan.
    const options = Array.isArray(parsed.options) ? parsed.options : [];
    const refined = {
      career: canonicalCareer,
      needsSpecifics: Boolean(parsed.needsSpecifics) && options.length > 0,
      question: parsed.question || "",
      helpText: parsed.helpText || "",
      options,
      // Normalised through archetypeProfile so an unrecognised value can
      // never reach the rest of the app — the enum constrains the model, but
      // the fallback is what makes that guarantee rather than a hope.
      routeArchetype: archetypeProfile(parsed.routeArchetype).id,
      routeReason: parsed.routeReason || "",
      // Filtered rather than trusted: a step with no label renders as a blank
      // row in a rail that sits on screen for the rest of the intake.
      outline: Array.isArray(parsed.outline)
        ? parsed.outline.filter((step: any) => step?.label && step?.detail)
        : [],
    };

    setCached(key, refined);
    await setDurable(key, refined);

    return NextResponse.json(refined);
  } catch (error: any) {
    console.error("Gemini API Error (refine-career):", error);
    return NextResponse.json(
      { error: "Failed to look up that career due to an external API error." },
      { status: 500 }
    );
  }
}
