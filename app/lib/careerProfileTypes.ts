// The shape of a career profile, shared by the route and the page.
//
// Its own file with no imports so the browser can hold these types without
// pulling in the route's server-only dependencies — the same split that
// planTypes.ts exists for.

import type { CareerArticle, CareerPhoto } from "@/app/lib/careerPhotos";
import type { LaborStats } from "@/app/lib/blsStats";
import type { DiscussionVenue } from "@/app/lib/careerVoices";

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

/**
 * Whether people in the job raise a theme as a reason to do it, a price they
 * pay for doing it, or a reason to think twice.
 *
 * Three values rather than a good/bad pair because most of what practitioners
 * actually say is neither — "you will work nights for your first three years"
 * is a fact you accept, not a complaint.
 */
export type VoiceTone = "reward" | "tradeoff" | "warning";

export interface CareerVoice {
  /** The recurring theme, as a short heading. */
  theme: string;
  tone: VoiceTone;
  /** What people in the job say about it, summarised — never quoted. */
  detail: string;
}

/** One stage of the usual route in, with how long it takes. */
export interface PathStage {
  label: string;
  detail: string;
  duration: string;
}

/**
 * Why the page does or doesn't have official figures.
 *
 * Four states, not a boolean, because the three failures have completely
 * different meanings to a student and the page has to say the right one. The
 * first version collapsed them and told a dental hygienist that BLS
 * "doesn't survey this job as its own occupation" — BLS does; the request had
 * simply hit its daily limit. A wrong claim about the data source is exactly
 * the failure that sourcing the data was meant to prevent.
 */
export type StatsStatus =
  /** Real figures below. */
  | "ok"
  /** Not a US student — OEWS surveys US establishments only. */
  | "outside-us"
  /** No BLS occupation is close enough to this career to be honest about. */
  | "unmatched"
  /** Matched, but BLS didn't answer or suppressed everything. Retryable. */
  | "unavailable";

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
  /**
   * The usual route in, stage by stage.
   *
   * The canonical version of the path — what it takes anyone to get in, not
   * what it takes THIS student, which is what the rail beside the wizard
   * shows once their education level is known.
   */
  typicalPath: PathStage[];
  /** What practitioners recurringly say. A synthesis, not quotes — see careerVoices.ts. */
  voices: CareerVoice[];
  /** Where to go and read it first-hand. */
  venues: DiscussionVenue[];
  /**
   * Official wage and employment figures, or null.
   *
   * Null for three separate reasons the page has to distinguish: the student
   * isn't in the US, the career matched no BLS occupation, or BLS suppressed
   * the figures. Everything else on this object is the model's judgement;
   * this is the only field that isn't.
   */
  stats: LaborStats | null;
  /** Which of the four situations above this profile is in. */
  statsStatus: StatsStatus;
  /**
   * The BLS occupation we matched, kept so a profile cached during an outage
   * can retry the figures without paying for the model call again.
   */
  socCode?: string;
  /** Jobs worth knowing about if this one doesn't fit. */
  relatedCareers: string[];
  /** Only links we actually fetched and got a real page from. */
  resources: CareerResource[];
  /** How many the model proposed that didn't resolve, so the UI can say so. */
  droppedResources: number;
  article: CareerArticle | null;
  photos: CareerPhoto[];
}
