import { describe, it, expect } from "vitest";
import {
  findMetro,
  findState,
  resolveAreas,
  stateAbbreviation,
} from "@/app/lib/blsAreas";

describe("findState", () => {
  it("accepts the full name or the abbreviation", () => {
    expect(findState("Florida")?.code).toBe("1200000");
    expect(findState("FL")?.code).toBe("1200000");
    expect(findState("florida")?.code).toBe("1200000");
  });

  it("returns null for something that isn't a state", () => {
    expect(findState("Ontario")).toBeNull();
    expect(findState("")).toBeNull();
  });
});

describe("stateAbbreviation", () => {
  it("normalises both directions", () => {
    expect(stateAbbreviation("Florida")).toBe("FL");
    expect(stateAbbreviation("fl")).toBe("FL");
    expect(stateAbbreviation("Nowhere")).toBeNull();
  });
});

describe("findMetro", () => {
  it("finds a metro named after the city", () => {
    expect(findMetro("Miami", "Florida")?.name).toMatch(/^Miami-Fort Lauderdale/);
    expect(findMetro("Orlando", "FL")?.name).toMatch(/^Orlando/);
  });

  it("finds a city that is not the first name in the metro", () => {
    // The student lives in St. Petersburg; BLS files them under Tampa.
    const metro = findMetro("St. Petersburg", "Florida");
    expect(metro?.name).toMatch(/Tampa/);
  });

  // City names repeat across the country, so the state has to scope the search
  // or "Portland" resolves to whichever one happens to sort first.
  it("does not cross state lines to find a city name", () => {
    expect(findMetro("Portland", "Oregon")?.name).toMatch(/, OR/);
    expect(findMetro("Portland", "Maine")?.name).toMatch(/, ME/);
  });

  it("returns null for a town too small to be its own metro", () => {
    expect(findMetro("Nowheresville", "Florida")).toBeNull();
  });
});

describe("resolveAreas", () => {
  it("resolves a US location down to the metro", () => {
    const areas = resolveAreas({
      countryCode: "US",
      subdivision: "Florida",
      city: "Miami",
    });
    expect(areas).not.toBeNull();
    expect(areas!.national.code).toBe("0000000");
    expect(areas!.state?.name).toBe("Florida");
    expect(areas!.metro?.name).toMatch(/Miami/);
  });

  it("still resolves the state when the city matches no metro", () => {
    const areas = resolveAreas({
      countryCode: "US",
      subdivision: "Florida",
      city: "Nowheresville",
    });
    expect(areas!.state?.name).toBe("Florida");
    expect(areas!.metro).toBeNull();
  });

  // OEWS surveys US establishments only. Quoting a US national wage to a
  // student in Edinburgh would be a real figure describing the wrong country.
  it("declines outside the United States", () => {
    expect(
      resolveAreas({ countryCode: "GB", subdivision: "Scotland", city: "Edinburgh" })
    ).toBeNull();
    expect(resolveAreas(undefined)).toBeNull();
  });
});
