// Shared domain types for the pathway / career-planning features.

import type { VerificationStatus } from "@/app/lib/urlVerify";

/** What the server found when it fetched the URL the model proposed. */
export interface StepLink {
  url: string | null;
  status: VerificationStatus;
  reason: string;
}

export interface PathwayStep {
  type: "degree" | "transfer" | "internship" | "exam";
  level: string;
  name: string;
  description: string;
  /**
   * The URL the model claims this program lives at.
   *
   * Only present on pathways generated for schools we hold no catalog for.
   * It is never linked directly — `link` below is what the UI uses, and that
   * only exists after the server has actually fetched this.
   */
  programUrl?: string;
  /**
   * The verified link, attached server-side after fetching `programUrl`.
   *
   * Catalog-backed pathways don't carry this: their links come from scraped
   * name→URL tables that were checked when the catalog was built, and
   * ProgramLink resolves those directly.
   */
  link?: StepLink;
}

export interface PathwayOption {
  title: string;
  isPrimary: boolean;
  steps: PathwayStep[];
}

export interface PathwayData {
  title: string;
  pathways: PathwayOption[];
  /**
   * How the programs in this pathway were sourced. "catalog" means every
   * degree step came from a scraped list of that school's real programs;
   * "ai" means the model proposed them and only the URLs were checked.
   */
  confidence?: "catalog" | "ai";
  /** Set on AI pathways: how many degree steps had their page confirmed. */
  verification?: {
    verified: number;
    fallback: number;
    unverified: number;
  };
}

export interface CareerPathway {
  career: string;
  data: PathwayData;
  selectedPathwayIndex: number;
}
