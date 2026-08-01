// The wire shape of a resolved plan.

import type { SchoolRef } from "@/app/lib/schoolRef";

export type TrackKind = "local" | "affordable" | "desired";

export interface PlanTrack {
  kind: TrackKind;
  /**
   * The full school record, not just an id.
   *
   * An AI-discovered school has no entry in any table we ship — its name,
   * URLs, and tuition only exist in the discovery response. /plan has to hand
   * all of that back to /api/generate-pathway to plan against it, so the track
   * carries the whole thing rather than a key that resolves to nothing.
   */
  school: SchoolRef;
  /** Card heading, e.g. "Closest to home". */
  title: string;
  /** One line under the heading. */
  subtitle: string;
  /** Why this school was picked, in a sentence a student would say back. */
  why: string;
  /** Other track kinds this same school also satisfies. */
  alsoCovers: TrackKind[];
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
