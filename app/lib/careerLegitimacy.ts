// The second half of the career content policy, available to every route.
//
// careerPolicy.ts describes a two-layer design: a static blocklist that
// "catches the obvious cases for free", plus a model check that catches "the
// phrasings it misses". That was only ever true for one route. The `legitimate`
// flag is read in /api/refine-career and nowhere else, so /api/generate-pathway,
// /api/find-schools, /api/career-profile and /api/school-lookup were each
// protected by the static list alone.
//
// That matters because refine-career is not a gate. It's an independently
// callable endpoint with no enforced relationship to the others — the wizard
// happens to call it first, but nothing makes a caller do that. A script
// POSTing a euphemism straight to generate-pathway met the keyword list and
// then Gemini's own alignment, which careerPolicy.ts explicitly treats as a
// last resort rather than a control.
//
// HOW THIS AVOIDS PAYING TWICE. The verdict is cached per canonical career in
// the same two layers everything else uses, and refine-career writes to it
// from the answer it was already getting for free (see recordLegitimacy).
// So in the normal wizard flow the other four routes read a verdict that cost
// nothing. Only a caller who skips the wizard pays for a check — which is
// exactly the right way round.

import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { generateJson } from "@/app/lib/geminiJson";

type Verdict = { legitimate: boolean };

function verdictKey(canonicalCareer: string): string {
  return cacheKey("legit", canonicalCareer);
}

/**
 * Store a verdict another call already established.
 *
 * refine-career asks for `legitimate` as one field of a response it makes
 * anyway, so its answer is free. Writing it here means the other routes never
 * have to ask the same question about the same career.
 */
export async function recordLegitimacy(
  canonicalCareer: string,
  legitimate: boolean
): Promise<void> {
  const verdict: Verdict = { legitimate };
  const key = verdictKey(canonicalCareer);
  setCached(key, verdict);
  await setDurable(key, verdict);
}

// Deliberately narrow. This asks one question, so it stays cheap enough to run
// on a route that would otherwise have skipped it — a few tokens against the
// full generation it guards.
const SYSTEM_PROMPT = `You decide whether a phrase names an occupation an education provider should plan a route into.

Answer false ONLY when the input names something we should not be writing an education plan for at all: contract violence, illegal drug trade, human trafficking, commercial sexual services, or fraud and theft as the occupation itself. Answer false for phrasings that mean those things without naming them plainly.

Answer TRUE for everything else, and read that literally. Dangerous jobs, dirty jobs, badly paid jobs, jobs with no formal training, jobs you personally would not recommend, and jobs adjacent to crime but on the right side of it — police officer, prison guard, bail bondsman, criminal defence lawyer, forensic toxicologist, drug and alcohol counsellor, ethical hacker, penetration tester, anti-money-laundering analyst, bartender, tattoo artist, mortician, exterminator, oil rig worker, professional gambler — are all real occupations and all get true.

Wrongly refusing a student's actual career is a worse failure than letting an edge case through. When you are unsure, the answer is true.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: { legitimate: { type: "boolean" } },
  required: ["legitimate"],
};

/**
 * Whether a career may be planned against.
 *
 * Returns the cached verdict when there is one, and asks the model exactly
 * once per canonical career when there isn't.
 *
 * FAILS OPEN. If the model call errors, this returns true. That is the same
 * direction rateLimit.ts and durableCache.ts already fail, and it follows the
 * instruction the prompt itself carries: wrongly refusing a student's real
 * career is the worse outcome. The static blocklist has already run by this
 * point and is unaffected, so failing open drops the second layer, not both.
 */
export async function careerIsLegitimate(
  canonicalCareer: string,
  apiKey: string
): Promise<boolean> {
  const key = verdictKey(canonicalCareer);

  const cached = getCached<Verdict>(key);
  if (cached) return cached.legitimate;

  const durable = await getDurable<Verdict>(key);
  if (durable) {
    setCached(key, durable);
    return durable.legitimate;
  }

  const result = await generateJson<Verdict>({
    apiKey,
    systemPrompt: SYSTEM_PROMPT,
    userQuery: `Occupation: ${canonicalCareer}`,
    responseSchema: RESPONSE_SCHEMA,
    // Lowest available: this is a classification, not prose, and the same
    // input should get the same answer every time.
    temperature: 0,
  });

  if (!result.ok) {
    console.error(
      `[career-policy] legitimacy check failed (${result.status}), allowing:`,
      result.error
    );
    return true;
  }

  const legitimate = result.data.legitimate !== false;
  await recordLegitimacy(canonicalCareer, legitimate);
  return legitimate;
}
