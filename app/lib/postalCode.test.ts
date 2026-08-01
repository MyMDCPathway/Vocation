import { describe, it, expect } from "vitest";
import {
  normalizePostalCode,
  postalExample,
  postalLabel,
  postalVariants,
  usesPostalCode,
} from "@/app/lib/postalCode";
import { COUNTRIES } from "@/app/lib/countries";

// The point of these is that Vocation now asks people ANYWHERE where they
// live. "ZIP code" is a US Postal Service term for a US-only system, and
// roughly sixty countries have no postal code at all — so a required field
// labelled "ZIP" would be wrong for most of the world and impossible for some.

describe("postalLabel", () => {
  it("uses each country's own word", () => {
    expect(postalLabel("US")).toBe("ZIP code");
    expect(postalLabel("GB")).toBe("Postcode");
    expect(postalLabel("IN")).toBe("PIN code");
    expect(postalLabel("IE")).toBe("Eircode");
    expect(postalLabel("BR")).toBe("CEP");
    expect(postalLabel("IT")).toBe("CAP");
  });

  it("never calls it a ZIP code outside the US", () => {
    // The specific mistake this file exists to prevent.
    for (const country of COUNTRIES) {
      if (country.code === "US" || country.code === "PH") continue;
      expect(postalLabel(country.code).toLowerCase(), country.code).not.toContain("zip");
    }
  });

  it("falls back to a neutral label for anywhere unlisted", () => {
    expect(postalLabel("MN")).toBe("Postal code");
  });

  it("is case-insensitive about the country code", () => {
    expect(postalLabel("gb")).toBe(postalLabel("GB"));
  });
});

describe("usesPostalCode", () => {
  it("hides the field for countries with no postal system", () => {
    // Asking a student in Dubai or Hong Kong for a postal code is asking for
    // something that does not exist.
    expect(usesPostalCode("AE")).toBe(false);
    expect(usesPostalCode("HK")).toBe(false);
    expect(usesPostalCode("PA")).toBe(false);
    expect(usesPostalCode("QA")).toBe(false);
  });

  it("shows it for countries that do", () => {
    for (const code of ["US", "GB", "CA", "DE", "JP", "IN", "BR", "AU", "IE"]) {
      expect(usesPostalCode(code), code).toBe(true);
    }
  });

  it("is case-insensitive", () => {
    expect(usesPostalCode("ae")).toBe(false);
  });
});

describe("postalExample", () => {
  it("shows a real format for the countries it covers", () => {
    expect(postalExample("US")).toBe("33132");
    expect(postalExample("GB")).toBe("EH1 1YZ");
    expect(postalExample("CA")).toBe("M5V 2T6");
  });

  it("returns nothing rather than a misleading example", () => {
    // A placeholder in the wrong format is worse than an empty one — people
    // copy the shape of it.
    expect(postalExample("MN")).toBeUndefined();
  });

  it("only gives examples for countries that have postal codes", () => {
    for (const country of COUNTRIES) {
      if (!usesPostalCode(country.code)) {
        expect(postalExample(country.code), country.code).toBeUndefined();
      }
    }
  });
});

describe("normalizePostalCode", () => {
  it("uppercases and trims", () => {
    expect(normalizePostalCode("  eh1 1yz ")).toBe("EH1 1YZ");
  });

  it("collapses runs of whitespace", () => {
    expect(normalizePostalCode("M5V   2T6")).toBe("M5V 2T6");
  });

  it("leaves a plain numeric code alone", () => {
    expect(normalizePostalCode("33132")).toBe("33132");
  });

  it("handles an empty string", () => {
    expect(normalizePostalCode("   ")).toBe("");
  });
});

describe("postalVariants", () => {
  // Postal data is keyed on a coarser unit than people write down. Verified
  // against the live service: "EH8 9YL" and "M5V 2T6" both miss, "EH8" and
  // "M5V" both hit. Without this, the lookup fails for precisely the people
  // who typed their address correctly.

  it("falls back to the UK outward code", () => {
    expect(postalVariants("EH8 9YL")).toContain("EH8");
  });

  it("falls back to the Canadian forward sortation area", () => {
    expect(postalVariants("M5V 2T6")).toContain("M5V");
  });

  it("falls back to the Dutch numeric part", () => {
    expect(postalVariants("1012 AB")).toContain("1012");
  });

  it("splits on a hyphen too", () => {
    expect(postalVariants("01310-100")).toContain("01310");
  });

  it("only ever truncates — never substitutes", () => {
    // This is what makes the fallback safe: every candidate is a prefix of
    // what they typed, so the worst case is a broader area that still
    // contains them, never a different place entirely.
    const entered = "EH8 9YL";
    for (const variant of postalVariants(entered)) {
      expect(entered.startsWith(variant)).toBe(true);
    }
  });

  it("offers nothing for a code with no separator", () => {
    expect(postalVariants("33132")).toEqual([]);
  });

  it("never includes the original", () => {
    expect(postalVariants("EH8 9YL")).not.toContain("EH8 9YL");
  });

  it("refuses a truncation too short to mean anything", () => {
    expect(postalVariants("A 1BC")).not.toContain("A");
  });
});
