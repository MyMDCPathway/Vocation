// Reads data/projections.json — BLS's own published "Fastest Growing
// Occupations" and "Most New Jobs" tables (bls.gov/ooh), transcribed by hand
// rather than fetched by a script.
//
// WHY NOT A FETCH SCRIPT, LIKE fetch-scorecard.mjs. bls.gov blocks automated
// retrieval outright — every attempt against the OOH pages, the bulk
// time-series download host, and the Employment Projections (EP) survey's
// own timeseries API (the one api.bls.gov/publicAPI/v2/timeseries/data/
// blsStats.ts already calls live for OEWS wage data) returned a bot-block
// response or an undocumented series ID this app has no reliable way to
// construct. The two tables here are BLS's own curated public-facing view of
// their Employment Projections dataset — not a third party's summary of it —
// copied verbatim from bls.gov/ooh/fastest-growing.htm and
// bls.gov/ooh/most-new-jobs.htm. See the "note" field in the committed JSON
// for the refresh procedure.
//
// Same governance as data/scorecard.json otherwise: committed rather than
// fetched live, reviewable and diffable in a PR, degrades to "no data" if
// ever unset rather than throwing.

import projectionsSnapshot from "@/data/projections.json";

export interface FastestGrowingOccupation {
  occupation: string;
  growthRatePercent: number;
  medianPay2024: number;
}

export interface MostNewJobsOccupation {
  occupation: string;
  newJobs: number;
  medianPay2024: number;
}

interface ProjectionsSnapshot {
  fetchedAt: string;
  source: string;
  sourceUrls: string[];
  projectionPeriod: string;
  blsLastModified: string;
  note: string;
  fastestGrowing: FastestGrowingOccupation[];
  mostNewJobs: MostNewJobsOccupation[];
}

const SNAPSHOT = projectionsSnapshot as ProjectionsSnapshot;

/** Provenance to print next to these tables — same rule scorecardMeta() follows. */
export function projectionsMeta(): Pick<
  ProjectionsSnapshot,
  "source" | "sourceUrls" | "projectionPeriod" | "blsLastModified"
> {
  const { source, sourceUrls, projectionPeriod, blsLastModified } = SNAPSHOT;
  return { source, sourceUrls, projectionPeriod, blsLastModified };
}

export function fastestGrowingOccupations(limit?: number): FastestGrowingOccupation[] {
  return limit ? SNAPSHOT.fastestGrowing.slice(0, limit) : SNAPSHOT.fastestGrowing;
}

export function mostNewJobsOccupations(limit?: number): MostNewJobsOccupation[] {
  return limit ? SNAPSHOT.mostNewJobs.slice(0, limit) : SNAPSHOT.mostNewJobs;
}
