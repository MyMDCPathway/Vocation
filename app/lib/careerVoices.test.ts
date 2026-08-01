import { describe, it, expect } from "vitest";
import { discussionVenues } from "@/app/lib/careerVoices";

describe("discussionVenues", () => {
  it("offers the three places worth reading", () => {
    const venues = discussionVenues("Registered Nurse");
    expect(venues.map((v) => v.label)).toEqual(["Reddit", "Glassdoor", "Indeed"]);
  });

  it("escapes the career into the query string", () => {
    const venues = discussionVenues("Air Traffic Controller");
    for (const venue of venues) {
      expect(venue.url).not.toMatch(/\s/);
      expect(() => new URL(venue.url)).not.toThrow();
    }
    expect(venues[0].url).toContain("Air%20Traffic%20Controller");
  });

  it("survives punctuation that would break a URL", () => {
    const venues = discussionVenues("Nurse Practitioner (Family) & Midwife");
    for (const venue of venues) {
      expect(() => new URL(venue.url)).not.toThrow();
      expect(venue.url).not.toMatch(/\s/);
    }
  });

  // Search endpoints, not guessed article URLs. A search resolves whether or
  // not it has results, so these can't rot into 404s — which matters because
  // all three sites block our server-side probe and we can't verify them the
  // way the resource links are verified.
  it("points at search endpoints rather than guessed deep links", () => {
    const venues = discussionVenues("Welder");
    expect(venues[0].url).toContain("/search");
    expect(venues[1].url).toContain("/Search/");
  });

  it("slugs the career for the Indeed career path", () => {
    expect(discussionVenues("Dental Hygienist")[2].url).toBe(
      "https://www.indeed.com/career/dental-hygienist"
    );
  });

  it("returns something usable for an empty career", () => {
    const venues = discussionVenues("");
    expect(venues).toHaveLength(3);
    for (const venue of venues) expect(() => new URL(venue.url)).not.toThrow();
  });
});
