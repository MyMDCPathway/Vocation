import { describe, it, expect } from "vitest";
import {
  hasUsableCoordinates,
  isOpenSchool,
  openSchoolId,
  schoolLocationLabel,
  type SchoolRef,
} from "@/app/lib/schoolRef";

// hasUsableCoordinates is the guard between "the model filled in a number"
// and "we put a pin on a map a student is looking at". A wrong coordinate
// isn't a silent failure like a wrong string — it visibly places a university
// in the sea.

describe("hasUsableCoordinates", () => {
  it("accepts real campus coordinates", () => {
    expect(hasUsableCoordinates({ latitude: 25.774, longitude: -80.194 })).toBe(true);
    // Southern and eastern hemispheres, and a high latitude.
    expect(hasUsableCoordinates({ latitude: -33.86, longitude: 151.2 })).toBe(true);
    expect(hasUsableCoordinates({ latitude: 69.65, longitude: 18.95 })).toBe(true);
  });

  it("rejects Null Island", () => {
    // (0, 0) is in the Gulf of Guinea and no university is there. It's the
    // signature of a model filling the field because the schema asked rather
    // than because it knew.
    expect(hasUsableCoordinates({ latitude: 0, longitude: 0 })).toBe(false);
  });

  it("accepts a genuine zero on one axis only", () => {
    // Greenwich and the equator are real places; only the pair is suspect.
    expect(hasUsableCoordinates({ latitude: 51.48, longitude: 0 })).toBe(true);
    expect(hasUsableCoordinates({ latitude: 0, longitude: 32.58 })).toBe(true);
  });

  it("rejects missing values", () => {
    expect(hasUsableCoordinates({})).toBe(false);
    expect(hasUsableCoordinates({ latitude: 25.774 })).toBe(false);
    expect(hasUsableCoordinates({ longitude: -80.194 })).toBe(false);
  });

  it("rejects NaN, which is what Number() gives for a missing field", () => {
    expect(hasUsableCoordinates({ latitude: Number("x"), longitude: 5 })).toBe(false);
    expect(hasUsableCoordinates({ latitude: Infinity, longitude: 5 })).toBe(false);
  });

  it("rejects out-of-range values", () => {
    expect(hasUsableCoordinates({ latitude: 91, longitude: 0.1 })).toBe(false);
    expect(hasUsableCoordinates({ latitude: -91, longitude: 0.1 })).toBe(false);
    expect(hasUsableCoordinates({ latitude: 10, longitude: 181 })).toBe(false);
    expect(hasUsableCoordinates({ latitude: 10, longitude: -181 })).toBe(false);
  });

  it("accepts the exact extremes", () => {
    expect(hasUsableCoordinates({ latitude: 90, longitude: 180 })).toBe(true);
    expect(hasUsableCoordinates({ latitude: -90, longitude: -180 })).toBe(true);
  });

  it("narrows the type so callers can read the coordinates", () => {
    const school: SchoolRef = {
      id: "mdc",
      name: "Miami Dade College",
      city: "Miami",
      subdivision: "Florida",
      countryCode: "US",
      kind: "state-college",
      source: "catalog",
      latitude: 25.774,
      longitude: -80.194,
    };
    if (hasUsableCoordinates(school)) {
      // Compiles only because the guard narrowed these to `number`.
      expect(school.latitude + school.longitude).toBeCloseTo(-54.42, 2);
    } else {
      throw new Error("expected the guard to pass");
    }
  });
});

describe("openSchoolId", () => {
  it("is stable for the same name, since it keys a cache", () => {
    expect(openSchoolId("Harvard University")).toBe(openSchoolId("Harvard University"));
  });

  it("marks AI-discovered schools apart from catalog ones", () => {
    // hasCatalog() must return false for these without a special case.
    expect(isOpenSchool(openSchoolId("Harvard University"))).toBe(true);
    expect(isOpenSchool("mdc")).toBe(false);
  });

  it("survives punctuation, accents, and case", () => {
    expect(openSchoolId("Université de Montréal")).toBe("open:universite-de-montreal");
    expect(openSchoolId("St. Thomas University")).toBe("open:st-thomas-university");
    expect(openSchoolId("  Trinity College, Dublin  ")).toBe("open:trinity-college-dublin");
  });

  it("keeps different schools distinct", () => {
    expect(openSchoolId("University of Miami")).not.toBe(openSchoolId("Miami University"));
  });
});

describe("schoolLocationLabel", () => {
  const base: SchoolRef = {
    id: "open:x",
    name: "X",
    city: "",
    subdivision: "",
    countryCode: "US",
    kind: "unknown",
    source: "ai",
  };

  it("joins city and region", () => {
    expect(schoolLocationLabel({ ...base, city: "Miami", subdivision: "Florida" })).toBe(
      "Miami, Florida"
    );
  });

  it("drops the missing half rather than leaving a dangling comma", () => {
    expect(schoolLocationLabel({ ...base, city: "Miami" })).toBe("Miami");
    expect(schoolLocationLabel({ ...base, subdivision: "Florida" })).toBe("Florida");
    expect(schoolLocationLabel(base)).toBe("");
  });
});
