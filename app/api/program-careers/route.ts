import { NextRequest, NextResponse } from "next/server";
import { careersForProgram, crosswalkMeta } from "@/app/lib/programCareers";

// "What jobs does this degree lead to?" — the school-first flow's third
// screen, reached by picking a program on /schools/[id]. Not scoped to a
// school: which careers a program of study leads to is the same answer
// regardless of which school teaches it, so this is a plain program-name
// lookup rather than nested under /api/schools/[id].

export async function GET(request: NextRequest) {
  const programName = (request.nextUrl.searchParams.get("program") ?? "").trim();
  if (!programName) {
    return NextResponse.json({ error: "A program name is required." }, { status: 400 });
  }

  const result = careersForProgram(programName);
  if (!result) {
    return NextResponse.json({ match: null, careers: [] });
  }

  return NextResponse.json({
    match: result.match,
    careers: result.careers,
    meta: crosswalkMeta(),
  });
}
