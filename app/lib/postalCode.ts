// Postal codes, which are not called ZIP codes and do not always exist.
//
// "ZIP code" is a United States Postal Service trademark for a US-only system.
// Everywhere else it's a postcode, a PIN code, a CEP, an Eircode, a CAP. And
// roughly sixty countries — the UAE, Hong Kong, Panama, Ireland until 2015 —
// have no national postal code system at all.
//
// Since Vocation now asks people anywhere in the world where they live, a
// required field labelled "ZIP code" would be wrong for most of the planet and
// impossible for some of it. So the field is optional everywhere, labelled per
// country, and hidden entirely where there's nothing to type.
//
// It earns its place by resolving to coordinates — see postalLookup. Without
// that it would be a field we collect and never use, which is worse than not
// asking.

/** What this country calls its postal code, and how to prompt for one. */
const POSTAL_LABELS: Record<string, string> = {
  US: "ZIP code",
  IN: "PIN code",
  IE: "Eircode",
  BR: "CEP",
  IT: "CAP",
  GB: "Postcode",
  AU: "Postcode",
  NZ: "Postcode",
  SG: "Postcode",
  MY: "Postcode",
  ZA: "Postal code",
  NL: "Postcode",
  PH: "ZIP code",
};

// Countries with no national postal code system. Curated from the UPU's own
// listing of members that don't operate one; the field is optional anyway, so
// a wrong entry here is cosmetic rather than blocking.
const NO_POSTAL_SYSTEM = new Set([
  "AE", "AG", "AO", "AW", "BF", "BI", "BJ", "BS", "BW", "BZ", "CD", "CF",
  "CG", "CI", "CK", "CM", "DJ", "DM", "ER", "FJ", "GD", "GH", "GM", "GN",
  "GQ", "GY", "HK", "JM", "KI", "KM", "KN", "KP", "LC", "LY", "ML", "MO",
  "MR", "MS", "MU", "MW", "NR", "NU", "PA", "QA", "RW", "SB", "SC", "SL",
  "SO", "SR", "ST", "SY", "TL", "TO", "TT", "TV", "TZ", "UG", "VU", "YE",
  "ZW",
]);

export function postalLabel(countryCode: string): string {
  return POSTAL_LABELS[countryCode.toUpperCase()] ?? "Postal code";
}

/** False when the country has no postal system, so the field is hidden. */
export function usesPostalCode(countryCode: string): boolean {
  return !NO_POSTAL_SYSTEM.has(countryCode.toUpperCase());
}

/** Example to show in the placeholder, so the expected format is obvious. */
const POSTAL_EXAMPLES: Record<string, string> = {
  US: "33132",
  GB: "EH1 1YZ",
  CA: "M5V 2T6",
  AU: "3000",
  IN: "110001",
  DE: "10115",
  FR: "75001",
  JP: "100-0001",
  BR: "01310-100",
  IT: "00184",
  ES: "28001",
  MX: "06000",
  NL: "1012",
  IE: "D02 XY45",
};

export function postalExample(countryCode: string): string | undefined {
  return POSTAL_EXAMPLES[countryCode.toUpperCase()];
}

export interface PostalPlace {
  /** Town or neighbourhood the code resolves to. */
  city: string;
  /** State, province, or region. */
  subdivision: string;
  latitude: number;
  longitude: number;
}

/**
 * Normalize before sending to a lookup service.
 *
 * UK and Canadian codes are commonly written with a space and the outward code
 * alone is enough to place someone; lookup services differ on whether they
 * want it. Uppercasing and collapsing whitespace handles most of the variance.
 */
export function normalizePostalCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Forms of the same code to try, in order, when a lookup misses.
 *
 * Postal data is often keyed on a coarser unit than people write down. UK
 * postcodes are stored by outward code, so "EH8 9YL" misses where "EH8" hits;
 * Canada is stored by forward sortation area, so "M5V 2T6" misses and "M5V"
 * hits; the Netherlands stores "1012" and not "1012 AB". Left unhandled, the
 * lookup fails for exactly the people who typed their address correctly.
 *
 * These are TRUNCATIONS of what the student entered, never substitutions — the
 * result can only ever be a broader area containing them, never a different
 * place. That's what makes the fallback safe.
 */
export function postalVariants(code: string): string[] {
  const normalized = normalizePostalCode(code);
  const variants: string[] = [];

  const add = (candidate: string) => {
    const trimmed = candidate.trim();
    if (trimmed.length >= 2 && trimmed !== normalized && !variants.includes(trimmed)) {
      variants.push(trimmed);
    }
  };

  // "EH8 9YL" -> "EH8", "1012 AB" -> "1012"
  if (normalized.includes(" ")) add(normalized.split(" ")[0]);
  // "01310-100" -> "01310". Japan writes "100-0001" and is stored that way, so
  // this is tried after the original rather than instead of it.
  if (normalized.includes("-")) add(normalized.split("-")[0]);

  return variants;
}
