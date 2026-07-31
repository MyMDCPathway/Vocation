// The wire shape of a resolved plan, split out so the browser can hold these
// types without holding the module that produces them.
//
// planTracks.ts imports every school's catalog — megabytes of program data
// that has no business in a client bundle. `import type` from there would be
// erased at compile time and technically fine, but it's one careless edit away
// from dragging the whole thing in. Keeping the types in their own file with
// no imports makes that mistake impossible rather than merely unlikely.

export type TrackKind = "local" | "affordable" | "desired";

export interface PlanTrack {
  kind: TrackKind;
  schoolId: string;
  schoolName: string;
  /** Card heading, e.g. "Closest to home". */
  title: string;
  /** One line under the heading, e.g. "Miami Dade College · 4 mi away". */
  subtitle: string;
  /** Why this school was picked, in a sentence a student would say back. */
  why: string;
  /** Other track kinds this same school also satisfies. */
  alsoCovers: TrackKind[];
  distanceMiles: number | null;
}

export interface ResolvedTracks {
  tracks: PlanTrack[];
  /** Things we could not do, and why. Rendered as caveats, never swallowed. */
  notes: string[];
}

export const TRACK_BADGES: Record<TrackKind, string> = {
  local: "Closest",
  affordable: "Cheapest",
  desired: "Your pick",
};
