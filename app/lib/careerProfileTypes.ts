// The shape of a career profile, shared by the route and the page.
//
// Its own file with no imports so the browser can hold these types without
// pulling in the route's server-only dependencies — the same split that
// planTypes.ts exists for.

import type { CareerArticle, CareerPhoto } from "@/app/lib/careerPhotos";

export type ResourceKind =
  | "professional-body"
  | "licensing"
  | "data"
  | "community"
  | "reading";

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  "professional-body": "Professional body",
  licensing: "Licensing",
  data: "Pay & outlook data",
  community: "Community",
  reading: "Further reading",
};

export interface CareerResource {
  label: string;
  url: string;
  kind: ResourceKind;
  detail: string;
}

export interface PayEstimate {
  low: number;
  median: number;
  high: number;
  /** ISO 4217, e.g. "USD", "GBP". */
  currency: string;
  /** The market these figures describe, e.g. "United States". */
  market: string;
  /** What drives the spread — seniority, region, specialty. */
  note: string;
}

export type DemandLevel =
  | "Growing fast"
  | "Steady demand"
  | "Competitive"
  | "Shrinking";

export interface CareerProfile {
  career: string;
  /** Two or three sentences on what the job actually is. */
  summary: string;
  /** What the work looks like day to day. */
  dayToDay: string[];
  demand: {
    level: DemandLevel;
    detail: string;
  };
  pay: PayEstimate;
  /** The usual way in, in one sentence. */
  entryRoute: string;
  /** e.g. "4-6 years from starting a degree". */
  timeToEntry: string;
  /** Jobs worth knowing about if this one doesn't fit. */
  relatedCareers: string[];
  /** Only links we actually fetched and got a real page from. */
  resources: CareerResource[];
  /** How many the model proposed that didn't resolve, so the UI can say so. */
  droppedResources: number;
  article: CareerArticle | null;
  photos: CareerPhoto[];
}
