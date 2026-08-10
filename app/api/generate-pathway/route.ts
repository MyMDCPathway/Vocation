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
import {
  buildPathwayRequest,
  hasCatalog,
} from "@/app/lib/pathwayPrompts";
import { DEFAULT_SCHOOL_ID } from "@/app/lib/floridaSchools";
import { buildOpenPathwayRequest } from "@/app/lib/openSchoolPrompt";
import { attachVerifiedLinks } from "@/app/lib/verifyPathway";
import { type SchoolRef } from "@/app/lib/schoolRef";
import {
  validateOpenSchoolRef,
  schoolRefFingerprint,
} from "@/app/lib/openSchoolValidation";
import { archetypeProfile } from "@/app/lib/routeArchetype";

// Server-side only - never exposed to the browser
const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { career, school, schoolRef, routeArchetype } = await request.json();

    if (!career || typeof career !== "string" || career.trim() === "") {
      return NextResponse.json(
        {
          error: "Career parameter is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    if (career.length > MAX_CAREER_INPUT) {
      return NextResponse.json({ error: TOO_LONG_MESSAGE }, { status: 400 });
    }

    // Two kinds of school now reach this route, and the difference decides
    // which prompt runs and whether the result gets URL-checked:
    //
    //   a floridaSchools.ts id ("mdc")  → scraped catalog, grounded prompt
    //   an "open:" id + a schoolRef     → no catalog, open prompt + verify
    //
    // A bare id we hold no catalog for is still rejected. Falling back to MDC
    // would show a student an MDC plan under another school's name.
    const schoolId = typeof school === "string" && school ? school : DEFAULT_SCHOOL_ID;
    // Validated, not cast. An "open:" id is by definition a deterministic slug
    // of the school's own name, so a ref whose name doesn't slug back to the
    // id it arrived with was never produced by a real lookup — that falls
    // through to the same 400 an uncatalogued school gets, below.
    const openSchool: SchoolRef | null = validateOpenSchoolRef(schoolId, schoolRef);
    // Normalized here rather than deep in the prompt builder, because the raw
    // string used to reach the cache key: an unbounded, unvalidated field in
    // a shared key is an unlimited supply of guaranteed cache misses, and
    // every miss is a Gemini generation someone else pays for.
    const archetype = archetypeProfile(routeArchetype).id;

    if (!openSchool && !hasCatalog(schoolId)) {
      return NextResponse.json(
        {
          error:
            "We don't have enough information about that school to plan against it. Pick it again from the school list so we can look it up.",
          unsupportedSchool: schoolId,
        },
        { status: 400 }
      );
    }

    // Collapse the many ways a student might spell the same job ("RN",
    // "nurse", "Registered Nurse") onto one title, so they share a single
    // generated pathway instead of one per spelling.
    const resolved = resolveCareer(career);

    // Ahead of the cache, the rate limiter, and the model call, in that order
    // of importance: a refused search must cost nothing, must not spend the
    // visitor's allowance, and must not be served from an entry generated
    // before this check existed.
    if (resolved.blocked) {
      return NextResponse.json(
        { error: BLOCKED_CAREER_MESSAGE, blocked: true },
        { status: 400 }
      );
    }

    const canonicalCareer = resolved.canonical;

    // Return a previously generated pathway for the same career without
    // spending a Gemini request (avoids the free-tier rate limit on repeats).
    // The school is part of the key: "Accountant" at MDC and at FIU are
    // different pathways, and sharing one entry would serve whichever was
    // generated first to both.
    const key = cacheKey(
      // The archetype changes the SHAPE of the plan, so two routes through the
      // same school are different answers and cannot share an entry.
      //
      // The fingerprint is what keeps this key safe to share. An open school's
      // details are supplied by the client and can't be checked against a
      // catalog, so without it one request carrying fabricated details for a
      // real school's name would overwrite the durable entry every later
      // visitor asking about that school gets served. Keyed by content, a
      // forged request can only ever read back its own answer.
      `pathway:${schoolId}${openSchool ? `:${archetype}:${schoolRefFingerprint(openSchool)}` : ""}`,
      canonicalCareer
    );
    const cached = getCached(key);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Layer 3. The in-memory layer above is wiped on every cold start, so
    // without this a pathway someone already paid Gemini for gets billed again
    // the next time a fresh instance handles the request. Checked only after
    // the free in-process layers miss, and a no-op when no store is
    // configured. Warms layer 2 so the rest of this instance's life is local.
    const durable = await getDurable(key);
    if (durable) {
      setCached(key, durable);
      return NextResponse.json(durable);
    }

    // Everything past here costs a Gemini request, so the limits apply from
    // this point only — browsing seeded or already-cached careers stays free
    // and unthrottled no matter how much someone clicks around.
    const limited = enforceGenerationLimits(request);
    if (limited) return limited;
    recordGeneration();
    logCacheMiss("pathway", `${schoolId}/${career}`, canonicalCareer);


    // Prompt, schema, and pathway shape all differ per school: MDC starts at
    // an associate and transfers out; FIU starts at the bachelor's. An open
    // school has no catalog to embed, so it gets the URL-claiming prompt whose
    // output is checked below instead.
    const prompt = openSchool
      ? buildOpenPathwayRequest(openSchool, canonicalCareer, archetype)
      : buildPathwayRequest(schoolId, canonicalCareer)!;
    const { systemPrompt, userQuery, responseSchema } = prompt;
    const apiUrl = geminiUrl(apiKey);

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      // Surface rate limiting to the client so it can tell the user to wait
      // instead of retrying immediately (free tier: ~20 requests/minute).
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
        { error: "Failed to generate pathway due to an external API error." },
        { status: 502 }
      );
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      const text = result.candidates[0].content.parts[0].text;
      let generatedData = JSON.parse(text);

      // The grounding step for open schools. Every program page the model
      // claimed gets fetched; anything that 404s, soft-404s, or bounces to a
      // homepage falls back to the school's program index or loses its link
      // entirely. Done BEFORE caching so the check is paid for once, not on
      // every read — and so a cached pathway carries its own provenance.
      //
      // Catalog pathways are deliberately NOT touched here. Their shape is
      // what 411 committed seed entries already hold and what two route tests
      // assert exactly, and the plan page reads provenance from the school
      // record rather than the payload — so stamping a redundant field on them
      // would change a stable contract to say something nothing reads.
      if (openSchool) {
        generatedData = await attachVerifiedLinks(generatedData, openSchool);
      }

      setCached(key, generatedData);
      // Awaited rather than fired-and-forgotten: serverless can freeze the
      // instance the moment the response is sent, which would drop the write
      // and waste the generation we just paid for. It's one fast REST call,
      // capped by TIMEOUT_MS, and it can't throw.
      await setDurable(key, generatedData);
      return NextResponse.json(generatedData);
    } else if (result.promptFeedback) {
      return NextResponse.json(
        { error: `Request blocked: ${result.promptFeedback.blockReason}` },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "No candidates returned from API." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate pathway due to an external API error." },
      { status: 500 }
    );
  }
}
