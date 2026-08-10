import { NextResponse } from "next/server";
import { listCuratedInterests, listAllIndustries } from "@/app/lib/interests";

// Both lists together: the homepage needs the six curated tiles, /interests
// needs the full 22-group taxonomy for "browse all industries" — small
// enough (28 rows, just counts) that splitting into two routes would only
// mean two round trips for no real savings.

export async function GET() {
  return NextResponse.json({
    curated: listCuratedInterests(),
    allIndustries: listAllIndustries(),
  });
}
