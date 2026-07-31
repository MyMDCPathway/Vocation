import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { resolveCareer } from "@/app/lib/careerCanonical";
import { enforceGenerationLimits, recordGeneration } from "@/app/lib/rateLimit";
import { geminiUrl } from "@/app/lib/geminiModel";
import { logCacheMiss } from "@/app/lib/missLog";

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
    mobilityNote: {
      type: "STRING",
      description:
        "One sentence on how willingness to work in rural areas, relocate, or work abroad affects entry into THIS career specifically. Concrete and factual, or empty string if it genuinely doesn't matter for this career.",
    },
  },
  required: ["needsSpecifics", "question", "helpText", "options", "mobilityNote"],
};

const SYSTEM_PROMPT = `You are a career advisor helping a student turn a rough idea into a plannable goal.

You will be given what a student typed as the career they want. Decide ONE thing first: is this specific enough to build an education plan around?

ALREADY SPECIFIC — set needsSpecifics to false:
- Named credentials with one training route: BCBA, Dental Hygienist, Registered Nurse, CPA, Paralegal, Radiologic Technologist, Air Traffic Controller, Electrician.
- Specific job titles where the degree path doesn't fork: Mechanical Engineer, Elementary School Teacher, Pharmacist, Veterinarian.

NEEDS NARROWING — set needsSpecifics to true:
- Umbrella terms covering jobs with genuinely different training: "doctor" (specialty determines residency length and boards), "lawyer" (practice area determines the degree focus), "engineer" (discipline determines the entire major).
- Fields where the specific role changes everything: "military" (branch), "professional athlete" (sport and position), "artist" (medium), "scientist" (field).

The test is strictly practical: would two different answers produce DIFFERENT degrees, DIFFERENT exams, or DIFFERENT numbers of years? If they'd produce the same plan, it is already specific. Do not ask a question just to seem thorough — a needless question is worse than no question.

When you do ask, the options must be real, distinct jobs a person actually holds, not categories. Order them from most common to least common.

For mobilityNote, say something concrete and true about how location flexibility affects this specific career — rural shortage areas and loan repayment for healthcare, overseas postings for military and energy work, market concentration for finance or entertainment. If location genuinely doesn't change anything for this career, return an empty string rather than filler.

Respond only with JSON matching the provided schema.`;

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

    // Same canonicalization as every other route, so "RN", "nurse", and "I
    // want to be a nurse" share one answer instead of three.
    const canonicalCareer = resolveCareer(career).canonical;

    const key = cacheKey("refine", canonicalCareer);
    const cached = getCached(key);
    if (cached) {
      return NextResponse.json(cached);
    }

    const durable = await getDurable(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json(durable);
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
      mobilityNote: parsed.mobilityNote || "",
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
