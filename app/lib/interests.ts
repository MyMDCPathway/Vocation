// "Browse by Interest" — real BLS occupations, grouped by their own Standard
// Occupational Classification major group. Server-only: the 830-row table
// this reads must never reach the browser directly (see schoolDirectory.ts's
// header for why — the same 232 kB /plan bundle problem HANDOFF documents).
//
// No invented job lists. Every title here is BLS's own verbatim occupation
// title from data/bls-occupations.json, grouped by the first two digits of
// its own SOC code — the federal taxonomy already IS the interest taxonomy,
// so there's nothing to curate except which few groups get a friendly tile
// on the homepage versus needing the "browse all industries" page.

import occupationTable from "@/data/bls-occupations.json";
import type { Occupation } from "@/app/lib/blsOccupations";

const OCCUPATIONS = occupationTable as Occupation[];

function majorGroup(code: string): string {
  return code.slice(0, 2);
}

/**
 * Every SOC major group, by its official BLS name — the full taxonomy the
 * "browse all industries" page lists, not just the six curated below.
 * https://www.bls.gov/soc/2018/major_groups.htm
 */
export const SOC_MAJOR_GROUPS: Record<string, string> = {
  "11": "Management",
  "13": "Business and Financial Operations",
  "15": "Computer and Mathematical",
  "17": "Architecture and Engineering",
  "19": "Life, Physical, and Social Science",
  "21": "Community and Social Service",
  "23": "Legal",
  "25": "Educational Instruction and Library",
  "27": "Arts, Design, Entertainment, Sports, and Media",
  "29": "Healthcare Practitioners and Technical",
  "31": "Healthcare Support",
  "33": "Protective Service",
  "35": "Food Preparation and Serving Related",
  "37": "Building and Grounds Cleaning and Maintenance",
  "39": "Personal Care and Service",
  "41": "Sales and Related",
  "43": "Office and Administrative Support",
  "45": "Farming, Fishing, and Forestry",
  "47": "Construction and Extraction",
  "49": "Installation, Maintenance, and Repair",
  "51": "Production",
  "53": "Transportation and Material Moving",
};

export interface CuratedInterest {
  slug: string;
  label: string;
  description: string;
  groups: string[];
}

/** The six front-door tiles on the homepage. Each is a real span of SOC
 *  major groups, not a separate taxonomy — see getInterestDetail below. */
export const CURATED_INTERESTS: CuratedInterest[] = [
  {
    slug: "stem",
    label: "STEM",
    description: "Science, technology, engineering, and mathematics.",
    groups: ["15", "17", "19"],
  },
  {
    slug: "healthcare",
    label: "Healthcare",
    description: "Clinical practice, therapy, and patient support.",
    groups: ["29", "31"],
  },
  {
    slug: "skilled-trades",
    label: "Skilled Trades",
    description: "Construction, repair, and installation work.",
    groups: ["47", "49"],
  },
  {
    slug: "business",
    label: "Business",
    description: "Management, finance, and operations.",
    groups: ["11", "13"],
  },
  {
    slug: "creative-arts",
    label: "Creative Arts",
    description: "Design, media, writing, and performance.",
    groups: ["27"],
  },
  {
    slug: "education",
    label: "Education",
    description: "Teaching and instruction, from K-12 to postsecondary.",
    groups: ["25"],
  },
];

function jobsForGroups(groups: string[]): Occupation[] {
  const set = new Set(groups);
  return OCCUPATIONS.filter((o) => set.has(majorGroup(o.code)));
}

/**
 * Which of a user's stored interest slugs (curated, e.g. "stem", or a raw
 * SOC major-group code from the browse-all page) a real SOC code falls
 * under — the label to show, or null if it matches none of them.
 *
 * Used by /api/projections to flag "in your Healthcare interest" on the BLS
 * trending tables. A code can only ever land in one of a user's slugs: the
 * six curated interests' groups are disjoint by construction (see
 * CURATED_INTERESTS above), and a raw industry slug is exactly one group.
 */
export function matchedInterestLabel(socCode: string, slugs: string[]): string | null {
  const group = majorGroup(socCode);
  for (const slug of slugs) {
    const curated = CURATED_INTERESTS.find((interest) => interest.slug === slug);
    if (curated) {
      if (curated.groups.includes(group)) return curated.label;
      continue;
    }
    if (slug === group && SOC_MAJOR_GROUPS[slug]) return SOC_MAJOR_GROUPS[slug];
  }
  return null;
}

export interface InterestSummary {
  slug: string;
  label: string;
  description: string;
  jobCount: number;
}

/** The six curated tiles, with real counts computed from the table — never
 *  a hardcoded number that could drift from what the pool actually returns. */
export function listCuratedInterests(): InterestSummary[] {
  return CURATED_INTERESTS.map((interest) => ({
    slug: interest.slug,
    label: interest.label,
    description: interest.description,
    jobCount: jobsForGroups(interest.groups).length,
  }));
}

/** All 22 SOC major groups, for the "browse all industries" page — the full
 *  taxonomy, not just the six with a homepage tile. */
export function listAllIndustries(): InterestSummary[] {
  return Object.entries(SOC_MAJOR_GROUPS).map(([code, label]) => ({
    slug: code,
    label,
    description: "",
    jobCount: jobsForGroups([code]).length,
  }));
}

export interface InterestDetail {
  slug: string;
  label: string;
  description: string;
  jobs: Occupation[];
}

/**
 * Resolves either a curated slug ("stem") or a raw SOC major-group code
 * ("51", from the browse-all page) to its real job pool. One lookup path for
 * both origins, since a curated interest is just a named span of groups and
 * a raw code is a span of exactly one.
 */
export function getInterestDetail(slug: string): InterestDetail | null {
  const curated = CURATED_INTERESTS.find((i) => i.slug === slug);
  if (curated) {
    return {
      slug: curated.slug,
      label: curated.label,
      description: curated.description,
      jobs: jobsForGroups(curated.groups),
    };
  }

  const industryLabel = SOC_MAJOR_GROUPS[slug];
  if (industryLabel) {
    return {
      slug,
      label: industryLabel,
      description: "",
      jobs: jobsForGroups([slug]),
    };
  }

  return null;
}
