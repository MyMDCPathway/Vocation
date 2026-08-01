// How you actually get into a job — which is not always "go to university".
//
// Vocation started as a Miami Dade College tool, and the shape of that
// assumption survived every rewrite since: pick a school, get a degree, here
// is what it costs. That is correct for a doctor and wrong for most of the
// working world. Asked about welding, the app confidently produced a list of
// universities — not a missing feature, but an answer that is wrong in the way
// that costs trust fastest.
//
// So the route is classified BEFORE any route-specific question gets asked,
// and the rest of the intake adapts to it. A welder is asked about
// apprenticeships and trade schools; an enlistee about branches; a developer
// about certifications. The "schools" step becomes a TRAINING PROVIDERS step
// whose vocabulary follows the route.
//
// Client-safe: no imports, so the wizard can hold these without pulling a
// catalog into the browser.

export type RouteArchetype =
  | "degree"
  | "credential"
  | "apprenticeship"
  | "certification"
  | "enlistment"
  | "talent"
  | "direct-entry";

export const ROUTE_ARCHETYPES: RouteArchetype[] = [
  "degree",
  "credential",
  "apprenticeship",
  "certification",
  "enlistment",
  "talent",
  "direct-entry",
];

/**
 * The default when we genuinely don't know.
 *
 * Degree, because it's the most structured route and therefore the most
 * useful wrong answer: a student shown a degree path for a job that doesn't
 * need one has been given an expensive option they can decline. The reverse —
 * telling a future surgeon they can start tomorrow — is not recoverable.
 */
export const DEFAULT_ARCHETYPE: RouteArchetype = "degree";

export interface ArchetypeProfile {
  id: RouteArchetype;
  /** How the student would describe this route. */
  label: string;
  /** What the thing that trains you is called on this route. */
  providerNoun: string;
  providerNounPlural: string;
  /** The providers question, in this route's own vocabulary. */
  providerQuestion: string;
  providerHelp: string;
  /** What to tell the model to go and find. */
  discoveryTarget: string;
  /**
   * Whether a scraped college catalog is a sensible source here.
   *
   * Only true where the route genuinely runs through a degree-granting
   * institution. Merging 53 Florida colleges into a welder's options is the
   * exact bug this file exists to fix.
   */
  usesCollegeCatalog: boolean;
  /** One line for the plan header, explaining the shape of the route. */
  summary: string;
}

export const ARCHETYPE_PROFILES: Record<RouteArchetype, ArchetypeProfile> = {
  degree: {
    id: "degree",
    label: "University degree",
    providerNoun: "school",
    providerNounPlural: "schools",
    providerQuestion: "Any of these schools you already have in mind?",
    providerHelp:
      "Colleges and universities near you that could lead to this career.",
    discoveryTarget:
      "universities and colleges offering the degree programs this career requires",
    usesCollegeCatalog: true,
    summary:
      "This career runs through a degree. The plan below is about which school, how long, and what it costs.",
  },

  credential: {
    id: "credential",
    label: "Licensed credential",
    providerNoun: "program",
    providerNounPlural: "programs",
    providerQuestion: "Any of these programs you already have in mind?",
    providerHelp:
      "Accredited programs near you that lead to the licence this career requires.",
    discoveryTarget:
      "accredited institutions offering the specific program required for licensure in this career, including community colleges and specialist schools",
    // A credential is usually earned at a college — an A.S. in Nursing, a
    // dental hygiene program — so the scraped catalogs are the right source.
    usesCollegeCatalog: true,
    summary:
      "This career is gated by a licence, not a degree as such. The plan below is about the accredited program and the exam that follows it.",
  },

  apprenticeship: {
    id: "apprenticeship",
    label: "Apprenticeship",
    providerNoun: "apprenticeship",
    providerNounPlural: "apprenticeships",
    providerQuestion: "Any of these apprenticeships you already have in mind?",
    providerHelp:
      "Union halls, contractors, and trade schools near you that take on apprentices. Most of these pay you while you train.",
    discoveryTarget:
      "registered apprenticeship programs, union locals (JATCs), trade schools, and contractors taking apprentices for this trade",
    // A welder does not enrol at a university. Merging the college catalog
    // here is the original bug.
    usesCollegeCatalog: false,
    summary:
      "This trade is learned on the job. The plan below is about getting into an apprenticeship, which pays you while you train rather than charging you.",
  },

  certification: {
    id: "certification",
    label: "Certifications",
    providerNoun: "training option",
    providerNounPlural: "training options",
    providerQuestion: "Any of these training options you already have in mind?",
    providerHelp:
      "Certification bodies, bootcamps, and self-study routes for this career. A degree is optional here.",
    discoveryTarget:
      "certification bodies, bootcamps, and training providers for this career — plus reputable self-study routes, since a degree is optional",
    usesCollegeCatalog: false,
    summary:
      "This career is hired on demonstrated skill and certifications. A degree helps but is not the gate — the plan below is about the certs that are.",
  },

  enlistment: {
    id: "enlistment",
    label: "Military service",
    providerNoun: "branch",
    providerNounPlural: "branches",
    providerQuestion: "Which branches are you considering?",
    providerHelp:
      "Each branch trains this role differently and offers different education benefits.",
    discoveryTarget:
      "the military branches that train this role, with their recruiting entry points",
    usesCollegeCatalog: false,
    summary:
      "This route runs through military service. The plan below is about enlistment, the training pipeline, and the education benefits that come with it.",
  },

  talent: {
    id: "talent",
    label: "Talent and portfolio",
    providerNoun: "pathway",
    providerNounPlural: "pathways",
    providerQuestion: "Any of these pathways you already have in mind?",
    providerHelp:
      "Programs, academies, and leagues that develop people into this career. Getting in is competitive and not only about study.",
    discoveryTarget:
      "development programs, academies, conservatories, leagues, and competitive pathways into this career — including routes abroad, which are often more accessible than the domestic ones",
    usesCollegeCatalog: false,
    summary:
      "This career is talent-gated rather than credential-gated. The plan below is about development pathways and the adjacent careers that share the same skills.",
  },

  "direct-entry": {
    id: "direct-entry",
    label: "Direct entry",
    providerNoun: "entry point",
    providerNounPlural: "entry points",
    providerQuestion: "Any of these entry points you already have in mind?",
    providerHelp:
      "Employers, short courses, and licences that get you into this work. You can start soon here.",
    discoveryTarget:
      "employers hiring into this role without a degree, plus any short course or licence legally required to start",
    usesCollegeCatalog: false,
    summary:
      "You can enter this career without a long program. The plan below is about the shortest legitimate route in, and what to do afterwards to move up.",
  },
};

export function archetypeProfile(archetype: string | undefined): ArchetypeProfile {
  const known = ROUTE_ARCHETYPES.find((id) => id === archetype);
  return ARCHETYPE_PROFILES[known ?? DEFAULT_ARCHETYPE];
}

/** True when scraped college catalogs are a sensible source for this route. */
export function usesCollegeCatalog(archetype: string | undefined): boolean {
  return archetypeProfile(archetype).usesCollegeCatalog;
}
