// One structured Gemini call, with the error handling every route was
// copy-pasting.
//
// Before this, each route repeated the same forty lines: build the payload,
// check response.ok, special-case 429, dig candidates[0].content.parts[0].text
// out of the envelope, JSON.parse it, and handle promptFeedback. Four copies
// had already drifted — get-career-suggestions hand-rolls a bracket-matching
// parser because it predates responseSchema, and its 200 lines of recovery
// code exist to work around a problem this function doesn't have.
//
// Uses responseSchema (structured output), so the model returns parseable JSON
// by construction rather than by instruction.

import { geminiUrl } from "@/app/lib/geminiModel";

export type GeminiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

export async function generateJson<T>(options: {
  apiKey: string;
  systemPrompt: string;
  userQuery: string;
  responseSchema: Record<string, unknown>;
  /** Lower for factual lookups (school names, subdivisions), higher for prose. */
  temperature?: number;
}): Promise<GeminiResult<T>> {
  const { apiKey, systemPrompt, userQuery, responseSchema, temperature } = options;

  try {
    const response = await fetch(geminiUrl(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          ...(temperature === undefined ? {} : { temperature }),
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Gemini API Error (${response.status}):`, body.slice(0, 500));

      // Surfaced distinctly so the client can say "wait 30 seconds" instead of
      // retrying immediately and burning more of the same quota.
      if (response.status === 429) {
        return {
          ok: false,
          status: 429,
          error:
            "The AI service is receiving too many requests right now. Please wait about 30 seconds and try again.",
        };
      }

      // 503 is Gemini saying "high demand, try later". It happens often enough
      // in practice to be worth its own message: a flat "returned an error"
      // reads as broken, when the honest answer is "this will work if you
      // press it again".
      if (response.status === 503) {
        return {
          ok: false,
          status: 503,
          error:
            "The AI service is busy right now. This usually clears in a few seconds — try again.",
        };
      }

      return { ok: false, status: 502, error: "The AI service returned an error." };
    }

    const result = await response.json();

    if (result.promptFeedback?.blockReason) {
      return {
        ok: false,
        status: 400,
        error: `Request blocked: ${result.promptFeedback.blockReason}`,
      };
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return { ok: false, status: 502, error: "The AI service returned nothing." };
    }

    return { ok: true, data: JSON.parse(text) as T };
  } catch (error: any) {
    // A malformed body reaches here as a SyntaxError. Structured output makes
    // that rare, but "rare" on a route students hit is still a 500 to handle.
    console.error("Gemini request failed:", error);
    return {
      ok: false,
      status: 502,
      error: "The AI service could not be reached.",
    };
  }
}
