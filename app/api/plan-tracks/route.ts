import { NextRequest, NextResponse } from "next/server";
import { resolveTracks } from "@/app/lib/planTracks";
import type { IntakeAnswers } from "@/app/lib/intake";

// Turns a completed intake into the two or three schools we'll generate
// against. No Gemini call and no rate limiting — this is string matching over
// catalogs we already ship, so it costs nothing and must never be the reason a
// student gets throttled.
//
// It exists as a route rather than a client-side function purely for bundle
// size: resolveTracks reads every school's program list to check relevance,
// which is megabytes of data that has no business in a browser.

export async function POST(request: NextRequest) {
  try {
    const answers = (await request.json()) as IntakeAnswers;

    if (!answers?.career?.resolved) {
      return NextResponse.json(
        { error: "A career is required before tracks can be resolved." },
        { status: 400 }
      );
    }

    return NextResponse.json(resolveTracks(answers));
  } catch (error: any) {
    console.error("Error resolving plan tracks:", error);
    return NextResponse.json(
      { error: "Failed to work out which schools fit your answers." },
      { status: 500 }
    );
  }
}
