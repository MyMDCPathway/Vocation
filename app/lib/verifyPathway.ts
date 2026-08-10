// Check every program URL an open-school pathway claims, before a student sees it.
//
// Runs server-side, once, between generation and caching — so the verification
// result is cached alongside the pathway and a repeat visitor doesn't re-fetch
// a dozen university pages.

import { verifyAll } from "@/app/lib/urlVerify";
import type { PathwayData, PathwayStep } from "@/app/lib/types";
import type { SchoolRef } from "@/app/lib/schoolRef";

/** Only degree steps at this school make a URL claim worth checking. */
function claimsAUrl(step: PathwayStep): boolean {
  return step.type === "degree" && Boolean(step.programUrl?.trim());
}

export async function attachVerifiedLinks(
  data: PathwayData,
  school: SchoolRef,
  fetchImpl: typeof fetch = fetch
): Promise<PathwayData> {
  // Flatten across pathways first: the same program often appears in more than
  // one route, and fetching a university's page twice for one plan is both
  // slow and rude.
  const steps: PathwayStep[] = [];
  for (const pathway of data.pathways ?? []) {
    for (const step of pathway.steps ?? []) {
      if (claimsAUrl(step)) steps.push(step);
    }
  }

  const byUrl = new Map<string, PathwayStep[]>();
  for (const step of steps) {
    const url = step.programUrl!.trim();
    const bucket = byUrl.get(url);
    if (bucket) bucket.push(step);
    else byUrl.set(url, [step]);
  }

  const uniqueUrls = [...byUrl.keys()];
  const results = await verifyAll(
    uniqueUrls,
    (url) => ({ exactUrl: url, programsUrl: school.programsUrl }),
    4,
    fetchImpl
  );

  const tally = { verified: 0, fallback: 0, unverified: 0 };

  uniqueUrls.forEach((url, index) => {
    const link = results[index];
    for (const step of byUrl.get(url) ?? []) {
      step.link = link;
    }
    tally[link.status] += byUrl.get(url)?.length ?? 0;
  });

  // A degree step that named no URL at all is unverified too — it just never
  // made a claim. Counting it keeps the summary honest about how much of the
  // pathway was actually checked.
  for (const pathway of data.pathways ?? []) {
    for (const step of pathway.steps ?? []) {
      if (step.type === "degree" && !step.link) {
        step.link = {
          url: school.programsUrl ?? null,
          status: school.programsUrl ? "fallback" : "unverified",
          reason: school.programsUrl
            ? "This step didn't name a specific program page, so this links to the school's program list."
            : "No program page was given for this step and we have no program list for this school.",
        };
        tally[step.link.status]++;
      }
    }
  }

  return { ...data, confidence: "ai", verification: tally };
}
