import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached, cacheKey } from "@/app/lib/apiCache";
import { getDurable, setDurable } from "@/app/lib/durableCache";
import { resolveCareer } from "@/app/lib/careerCanonical";
import { enforceGenerationLimits, recordGeneration } from "@/app/lib/rateLimit";
import { geminiUrl } from "@/app/lib/geminiModel";
import { logCacheMiss } from "@/app/lib/missLog";
import {
  buildPathwayRequest,
  hasCatalog,
  SCHOOLS_WITH_CATALOG,
} from "@/app/lib/pathwayPrompts";
import { DEFAULT_SCHOOL_ID } from "@/app/lib/floridaSchools";

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
    const { career, school } = await request.json();

    if (!career || typeof career !== "string" || career.trim() === "") {
      return NextResponse.json(
        {
          error: "Career parameter is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    // The school decides the whole shape of the pathway, so it must be one we
    // hold a real program catalog for. Anything else is rejected rather than
    // silently falling back to MDC, which would show a student an MDC plan
    // under another school's name.
    const schoolId = typeof school === "string" && school ? school : DEFAULT_SCHOOL_ID;

    if (!hasCatalog(schoolId)) {
      return NextResponse.json(
        {
          error:
            `Pathways aren't available for that school yet. Supported: ${SCHOOLS_WITH_CATALOG.join(", ")}.`,
          unsupportedSchool: schoolId,
        },
        { status: 400 }
      );
    }

    // Collapse the many ways a student might spell the same job ("RN",
    // "nurse", "Registered Nurse") onto one title, so they share a single
    // generated pathway instead of one per spelling.
    const canonicalCareer = resolveCareer(career).canonical;

    // Return a previously generated pathway for the same career without
    // spending a Gemini request (avoids the free-tier rate limit on repeats).
    // The school is part of the key: "Accountant" at MDC and at FIU are
    // different pathways, and sharing one entry would serve whichever was
    // generated first to both.
    const key = cacheKey(`pathway:${schoolId}`, canonicalCareer);
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
    // an associate and transfers out; FIU starts at the bachelor's. Returns
    // null for the 59 schools with no catalog, which the guard above rejects.
    const prompt = buildPathwayRequest(schoolId, canonicalCareer)!;
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
      const generatedData = JSON.parse(text);
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
