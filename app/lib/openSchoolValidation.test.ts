import { describe, it, expect } from "vitest";
import {
  validateOpenSchoolRef,
  schoolRefFingerprint,
} from "@/app/lib/openSchoolValidation";
import { openSchoolId, type SchoolRef } from "@/app/lib/schoolRef";

const NAME = "Example University";
const ID = openSchoolId(NAME); // "open:example-university"

function rawRef(overrides: Record<string, unknown> = {}) {
  return {
    id: ID,
    name: NAME,
    city: "Springfield",
    subdivision: "Illinois",
    countryCode: "US",
    kind: "private",
    source: "ai",
    website: "https://example.edu",
    programsUrl: "https://example.edu/programs",
    ...overrides,
  };
}

describe("validateOpenSchoolRef — identity", () => {
  it("accepts a ref whose name slugs back to the id it arrived with", () => {
    const result = validateOpenSchoolRef(ID, rawRef());
    expect(result).not.toBeNull();
    expect(result!.name).toBe(NAME);
    expect(result!.id).toBe(ID);
  });

  it("rejects a ref whose name does not match the claimed id", () => {
    // The poisoning shape: claim a real school's id, supply someone else's
    // details. There is no catalog to check an open school against, but the
    // id IS a function of the name, so this much is always checkable.
    expect(validateOpenSchoolRef(ID, rawRef({ name: "Totally Different College" }))).toBeNull();
  });

  it("rejects a non-open school id outright", () => {
    expect(validateOpenSchoolRef("mdc", rawRef())).toBeNull();
  });

  it("rejects a missing, empty, or non-object ref", () => {
    expect(validateOpenSchoolRef(ID, undefined)).toBeNull();
    expect(validateOpenSchoolRef(ID, null)).toBeNull();
    expect(validateOpenSchoolRef(ID, "a string")).toBeNull();
    expect(validateOpenSchoolRef(ID, rawRef({ name: "" }))).toBeNull();
    expect(validateOpenSchoolRef(ID, rawRef({ name: 42 }))).toBeNull();
  });
});

describe("validateOpenSchoolRef — normalization", () => {
  it("caps oversized fields so a request body cannot inflate the prompt", () => {
    const result = validateOpenSchoolRef(
      ID,
      rawRef({ city: "x".repeat(5000), note: "y".repeat(5000) })
    );
    expect(result).not.toBeNull();
    expect(result!.city.length).toBe(200);
    expect(result!.note!.length).toBe(400);
  });

  it("falls back to 'unknown' for an unrecognized kind rather than passing it through", () => {
    const result = validateOpenSchoolRef(ID, rawRef({ kind: "not-a-real-kind" }));
    expect(result!.kind).toBe("unknown");
  });

  it("always reports source 'ai' even if the client claims 'catalog'", () => {
    // A catalog claim would imply a scraped program list constrains the
    // prompt. There isn't one — that's what makes this an open school.
    const result = validateOpenSchoolRef(ID, rawRef({ source: "catalog" }));
    expect(result!.source).toBe("ai");
  });

  it("drops non-finite coordinates", () => {
    const result = validateOpenSchoolRef(
      ID,
      rawRef({ latitude: Number.NaN, longitude: "42" })
    );
    expect(result!.latitude).toBeUndefined();
    expect(result!.longitude).toBeUndefined();
  });
});

describe("schoolRefFingerprint", () => {
  const base = validateOpenSchoolRef(ID, rawRef()) as SchoolRef;

  it("is stable for identical content", () => {
    const again = validateOpenSchoolRef(ID, rawRef()) as SchoolRef;
    expect(schoolRefFingerprint(again)).toBe(schoolRefFingerprint(base));
  });

  it("differs when prompt-bearing content differs", () => {
    const forged = validateOpenSchoolRef(
      ID,
      rawRef({ programsUrl: "https://attacker.example/programs" })
    ) as SchoolRef;
    expect(schoolRefFingerprint(forged)).not.toBe(schoolRefFingerprint(base));
  });

  it("ignores cosmetic fields that never reach the prompt", () => {
    const moved = validateOpenSchoolRef(
      ID,
      rawRef({ latitude: 12.34, longitude: 56.78 })
    ) as SchoolRef;
    expect(schoolRefFingerprint(moved)).toBe(schoolRefFingerprint(base));
  });
});
