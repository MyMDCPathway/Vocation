// Every country a student might be studying from.
//
// ISO 3166-1 alpha-2 codes and common English names. The code is the key
// everywhere else in the app — names get spelled a dozen ways and change more
// often than codes do.
//
// Flags are DERIVED, not stored. Every alpha-2 code maps to a flag emoji by
// offsetting each letter into the Unicode regional-indicator block, so there's
// no 250-entry emoji table to keep in sync and no way for a flag to drift away
// from its country.
//
// Subdivisions (states, provinces, prefectures) are deliberately NOT here. That
// would be ~5,000 hand-typed rows across every country, which is both a large
// bundle and a large surface for me to get quietly wrong. They're fetched per
// country from /api/regions instead and cached like everything else.

export interface Country {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  /** What this country calls a first-level subdivision. */
  subdivisionLabel: string;
}

const STATE = "State";
const PROVINCE = "Province";
const REGION = "Region";
const COUNTY = "County";
const DEPARTMENT = "Department";
const PREFECTURE = "Prefecture";
const GOVERNORATE = "Governorate";
const DISTRICT = "District";
const EMIRATE = "Emirate";
const CANTON = "Canton";
const OBLAST = "Region";

// Sorted by name so the picker doesn't need to sort at render time.
export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan", subdivisionLabel: PROVINCE },
  { code: "AL", name: "Albania", subdivisionLabel: COUNTY },
  { code: "DZ", name: "Algeria", subdivisionLabel: PROVINCE },
  { code: "AD", name: "Andorra", subdivisionLabel: "Parish" },
  { code: "AO", name: "Angola", subdivisionLabel: PROVINCE },
  { code: "AG", name: "Antigua and Barbuda", subdivisionLabel: "Parish" },
  { code: "AR", name: "Argentina", subdivisionLabel: PROVINCE },
  { code: "AM", name: "Armenia", subdivisionLabel: PROVINCE },
  { code: "AU", name: "Australia", subdivisionLabel: "State or Territory" },
  { code: "AT", name: "Austria", subdivisionLabel: STATE },
  { code: "AZ", name: "Azerbaijan", subdivisionLabel: DISTRICT },
  { code: "BS", name: "Bahamas", subdivisionLabel: DISTRICT },
  { code: "BH", name: "Bahrain", subdivisionLabel: GOVERNORATE },
  { code: "BD", name: "Bangladesh", subdivisionLabel: "Division" },
  { code: "BB", name: "Barbados", subdivisionLabel: "Parish" },
  { code: "BY", name: "Belarus", subdivisionLabel: OBLAST },
  { code: "BE", name: "Belgium", subdivisionLabel: PROVINCE },
  { code: "BZ", name: "Belize", subdivisionLabel: DISTRICT },
  { code: "BJ", name: "Benin", subdivisionLabel: DEPARTMENT },
  { code: "BT", name: "Bhutan", subdivisionLabel: DISTRICT },
  { code: "BO", name: "Bolivia", subdivisionLabel: DEPARTMENT },
  { code: "BA", name: "Bosnia and Herzegovina", subdivisionLabel: "Entity" },
  { code: "BW", name: "Botswana", subdivisionLabel: DISTRICT },
  { code: "BR", name: "Brazil", subdivisionLabel: STATE },
  { code: "BN", name: "Brunei", subdivisionLabel: DISTRICT },
  { code: "BG", name: "Bulgaria", subdivisionLabel: PROVINCE },
  { code: "BF", name: "Burkina Faso", subdivisionLabel: REGION },
  { code: "BI", name: "Burundi", subdivisionLabel: PROVINCE },
  { code: "KH", name: "Cambodia", subdivisionLabel: PROVINCE },
  { code: "CM", name: "Cameroon", subdivisionLabel: REGION },
  { code: "CA", name: "Canada", subdivisionLabel: "Province or Territory" },
  { code: "CV", name: "Cape Verde", subdivisionLabel: "Municipality" },
  { code: "CF", name: "Central African Republic", subdivisionLabel: PREFECTURE },
  { code: "TD", name: "Chad", subdivisionLabel: PROVINCE },
  { code: "CL", name: "Chile", subdivisionLabel: REGION },
  { code: "CN", name: "China", subdivisionLabel: PROVINCE },
  { code: "CO", name: "Colombia", subdivisionLabel: DEPARTMENT },
  { code: "KM", name: "Comoros", subdivisionLabel: "Island" },
  { code: "CG", name: "Congo (Republic)", subdivisionLabel: DEPARTMENT },
  { code: "CD", name: "Congo (DRC)", subdivisionLabel: PROVINCE },
  { code: "CR", name: "Costa Rica", subdivisionLabel: PROVINCE },
  { code: "CI", name: "Côte d'Ivoire", subdivisionLabel: DISTRICT },
  { code: "HR", name: "Croatia", subdivisionLabel: COUNTY },
  { code: "CU", name: "Cuba", subdivisionLabel: PROVINCE },
  { code: "CY", name: "Cyprus", subdivisionLabel: DISTRICT },
  { code: "CZ", name: "Czechia", subdivisionLabel: REGION },
  { code: "DK", name: "Denmark", subdivisionLabel: REGION },
  { code: "DJ", name: "Djibouti", subdivisionLabel: REGION },
  { code: "DM", name: "Dominica", subdivisionLabel: "Parish" },
  { code: "DO", name: "Dominican Republic", subdivisionLabel: PROVINCE },
  { code: "EC", name: "Ecuador", subdivisionLabel: PROVINCE },
  { code: "EG", name: "Egypt", subdivisionLabel: GOVERNORATE },
  { code: "SV", name: "El Salvador", subdivisionLabel: DEPARTMENT },
  { code: "GQ", name: "Equatorial Guinea", subdivisionLabel: PROVINCE },
  { code: "ER", name: "Eritrea", subdivisionLabel: REGION },
  { code: "EE", name: "Estonia", subdivisionLabel: COUNTY },
  { code: "SZ", name: "Eswatini", subdivisionLabel: REGION },
  { code: "ET", name: "Ethiopia", subdivisionLabel: REGION },
  { code: "FJ", name: "Fiji", subdivisionLabel: "Division" },
  { code: "FI", name: "Finland", subdivisionLabel: REGION },
  { code: "FR", name: "France", subdivisionLabel: REGION },
  { code: "GA", name: "Gabon", subdivisionLabel: PROVINCE },
  { code: "GM", name: "Gambia", subdivisionLabel: "Division" },
  { code: "GE", name: "Georgia", subdivisionLabel: REGION },
  { code: "DE", name: "Germany", subdivisionLabel: STATE },
  { code: "GH", name: "Ghana", subdivisionLabel: REGION },
  { code: "GR", name: "Greece", subdivisionLabel: REGION },
  { code: "GD", name: "Grenada", subdivisionLabel: "Parish" },
  { code: "GT", name: "Guatemala", subdivisionLabel: DEPARTMENT },
  { code: "GN", name: "Guinea", subdivisionLabel: REGION },
  { code: "GW", name: "Guinea-Bissau", subdivisionLabel: REGION },
  { code: "GY", name: "Guyana", subdivisionLabel: REGION },
  { code: "HT", name: "Haiti", subdivisionLabel: DEPARTMENT },
  { code: "HN", name: "Honduras", subdivisionLabel: DEPARTMENT },
  { code: "HK", name: "Hong Kong", subdivisionLabel: DISTRICT },
  { code: "HU", name: "Hungary", subdivisionLabel: COUNTY },
  { code: "IS", name: "Iceland", subdivisionLabel: REGION },
  { code: "IN", name: "India", subdivisionLabel: "State or Union Territory" },
  { code: "ID", name: "Indonesia", subdivisionLabel: PROVINCE },
  { code: "IR", name: "Iran", subdivisionLabel: PROVINCE },
  { code: "IQ", name: "Iraq", subdivisionLabel: GOVERNORATE },
  { code: "IE", name: "Ireland", subdivisionLabel: COUNTY },
  { code: "IL", name: "Israel", subdivisionLabel: DISTRICT },
  { code: "IT", name: "Italy", subdivisionLabel: REGION },
  { code: "JM", name: "Jamaica", subdivisionLabel: "Parish" },
  { code: "JP", name: "Japan", subdivisionLabel: PREFECTURE },
  { code: "JO", name: "Jordan", subdivisionLabel: GOVERNORATE },
  { code: "KZ", name: "Kazakhstan", subdivisionLabel: REGION },
  { code: "KE", name: "Kenya", subdivisionLabel: COUNTY },
  { code: "KW", name: "Kuwait", subdivisionLabel: GOVERNORATE },
  { code: "KG", name: "Kyrgyzstan", subdivisionLabel: REGION },
  { code: "LA", name: "Laos", subdivisionLabel: PROVINCE },
  { code: "LV", name: "Latvia", subdivisionLabel: "Municipality" },
  { code: "LB", name: "Lebanon", subdivisionLabel: GOVERNORATE },
  { code: "LS", name: "Lesotho", subdivisionLabel: DISTRICT },
  { code: "LR", name: "Liberia", subdivisionLabel: COUNTY },
  { code: "LY", name: "Libya", subdivisionLabel: DISTRICT },
  { code: "LI", name: "Liechtenstein", subdivisionLabel: "Municipality" },
  { code: "LT", name: "Lithuania", subdivisionLabel: COUNTY },
  { code: "LU", name: "Luxembourg", subdivisionLabel: CANTON },
  { code: "MO", name: "Macao", subdivisionLabel: "Parish" },
  { code: "MG", name: "Madagascar", subdivisionLabel: REGION },
  { code: "MW", name: "Malawi", subdivisionLabel: DISTRICT },
  { code: "MY", name: "Malaysia", subdivisionLabel: STATE },
  { code: "MV", name: "Maldives", subdivisionLabel: "Atoll" },
  { code: "ML", name: "Mali", subdivisionLabel: REGION },
  { code: "MT", name: "Malta", subdivisionLabel: REGION },
  { code: "MR", name: "Mauritania", subdivisionLabel: REGION },
  { code: "MU", name: "Mauritius", subdivisionLabel: DISTRICT },
  { code: "MX", name: "Mexico", subdivisionLabel: STATE },
  { code: "MD", name: "Moldova", subdivisionLabel: DISTRICT },
  { code: "MC", name: "Monaco", subdivisionLabel: "Ward" },
  { code: "MN", name: "Mongolia", subdivisionLabel: PROVINCE },
  { code: "ME", name: "Montenegro", subdivisionLabel: "Municipality" },
  { code: "MA", name: "Morocco", subdivisionLabel: REGION },
  { code: "MZ", name: "Mozambique", subdivisionLabel: PROVINCE },
  { code: "MM", name: "Myanmar", subdivisionLabel: STATE },
  { code: "NA", name: "Namibia", subdivisionLabel: REGION },
  { code: "NP", name: "Nepal", subdivisionLabel: PROVINCE },
  { code: "NL", name: "Netherlands", subdivisionLabel: PROVINCE },
  { code: "NZ", name: "New Zealand", subdivisionLabel: REGION },
  { code: "NI", name: "Nicaragua", subdivisionLabel: DEPARTMENT },
  { code: "NE", name: "Niger", subdivisionLabel: REGION },
  { code: "NG", name: "Nigeria", subdivisionLabel: STATE },
  { code: "MK", name: "North Macedonia", subdivisionLabel: "Municipality" },
  { code: "NO", name: "Norway", subdivisionLabel: COUNTY },
  { code: "OM", name: "Oman", subdivisionLabel: GOVERNORATE },
  { code: "PK", name: "Pakistan", subdivisionLabel: PROVINCE },
  { code: "PS", name: "Palestine", subdivisionLabel: GOVERNORATE },
  { code: "PA", name: "Panama", subdivisionLabel: PROVINCE },
  { code: "PG", name: "Papua New Guinea", subdivisionLabel: PROVINCE },
  { code: "PY", name: "Paraguay", subdivisionLabel: DEPARTMENT },
  { code: "PE", name: "Peru", subdivisionLabel: REGION },
  { code: "PH", name: "Philippines", subdivisionLabel: PROVINCE },
  { code: "PL", name: "Poland", subdivisionLabel: "Voivodeship" },
  { code: "PT", name: "Portugal", subdivisionLabel: DISTRICT },
  { code: "PR", name: "Puerto Rico", subdivisionLabel: "Municipality" },
  { code: "QA", name: "Qatar", subdivisionLabel: "Municipality" },
  { code: "RO", name: "Romania", subdivisionLabel: COUNTY },
  { code: "RU", name: "Russia", subdivisionLabel: "Federal Subject" },
  { code: "RW", name: "Rwanda", subdivisionLabel: PROVINCE },
  { code: "SA", name: "Saudi Arabia", subdivisionLabel: REGION },
  { code: "SN", name: "Senegal", subdivisionLabel: REGION },
  { code: "RS", name: "Serbia", subdivisionLabel: DISTRICT },
  { code: "SC", name: "Seychelles", subdivisionLabel: DISTRICT },
  { code: "SL", name: "Sierra Leone", subdivisionLabel: PROVINCE },
  { code: "SG", name: "Singapore", subdivisionLabel: DISTRICT },
  { code: "SK", name: "Slovakia", subdivisionLabel: REGION },
  { code: "SI", name: "Slovenia", subdivisionLabel: "Municipality" },
  { code: "SO", name: "Somalia", subdivisionLabel: REGION },
  { code: "ZA", name: "South Africa", subdivisionLabel: PROVINCE },
  { code: "KR", name: "South Korea", subdivisionLabel: PROVINCE },
  { code: "SS", name: "South Sudan", subdivisionLabel: STATE },
  { code: "ES", name: "Spain", subdivisionLabel: "Autonomous Community" },
  { code: "LK", name: "Sri Lanka", subdivisionLabel: PROVINCE },
  { code: "SD", name: "Sudan", subdivisionLabel: STATE },
  { code: "SR", name: "Suriname", subdivisionLabel: DISTRICT },
  { code: "SE", name: "Sweden", subdivisionLabel: COUNTY },
  { code: "CH", name: "Switzerland", subdivisionLabel: CANTON },
  { code: "SY", name: "Syria", subdivisionLabel: GOVERNORATE },
  { code: "TW", name: "Taiwan", subdivisionLabel: COUNTY },
  { code: "TJ", name: "Tajikistan", subdivisionLabel: REGION },
  { code: "TZ", name: "Tanzania", subdivisionLabel: REGION },
  { code: "TH", name: "Thailand", subdivisionLabel: PROVINCE },
  { code: "TL", name: "Timor-Leste", subdivisionLabel: "Municipality" },
  { code: "TG", name: "Togo", subdivisionLabel: REGION },
  { code: "TT", name: "Trinidad and Tobago", subdivisionLabel: REGION },
  { code: "TN", name: "Tunisia", subdivisionLabel: GOVERNORATE },
  { code: "TR", name: "Türkiye", subdivisionLabel: PROVINCE },
  { code: "TM", name: "Turkmenistan", subdivisionLabel: REGION },
  { code: "UG", name: "Uganda", subdivisionLabel: DISTRICT },
  { code: "UA", name: "Ukraine", subdivisionLabel: OBLAST },
  { code: "AE", name: "United Arab Emirates", subdivisionLabel: EMIRATE },
  { code: "GB", name: "United Kingdom", subdivisionLabel: "Nation or Region" },
  { code: "US", name: "United States", subdivisionLabel: STATE },
  { code: "UY", name: "Uruguay", subdivisionLabel: DEPARTMENT },
  { code: "UZ", name: "Uzbekistan", subdivisionLabel: REGION },
  { code: "VE", name: "Venezuela", subdivisionLabel: STATE },
  { code: "VN", name: "Vietnam", subdivisionLabel: PROVINCE },
  { code: "YE", name: "Yemen", subdivisionLabel: GOVERNORATE },
  { code: "ZM", name: "Zambia", subdivisionLabel: PROVINCE },
  { code: "ZW", name: "Zimbabwe", subdivisionLabel: PROVINCE },
];

/** Shown first in the picker — where the app already has real catalog data. */
/**
 * The fifty states and DC, shipped rather than fetched.
 *
 * /api/regions asks a language model for a country's subdivisions, which is a
 * defensible trade for the other ~190 countries — see that route's comment.
 * It is not a defensible trade for this one. The US is where nearly every
 * visitor lives, so the most common path through the intake was paying a model
 * call and a spinner for a list of fifty names that haven't changed since 1959.
 *
 * SPELLINGS MATTER HERE. These strings become StudentLocation.subdivision and
 * are looked up against the BLS area table (findState in blsAreas.ts), which
 * publishes "District of Columbia". The generated list called it "Washington,
 * D.C.", which matched nothing — so a student in DC silently lost their state
 * wage figures. Keep these exactly as BLS writes them.
 */
export const US_SUBDIVISIONS: string[] = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

export const DEFAULT_COUNTRY = "US";

// The subdivision Vocation holds scraped program catalogs for. Everything else
// in the world is planned by AI with URL verification; here we have the real
// programs, so this pairing gets the grounded prompt instead.
export const CATALOG_COUNTRY = "US";
export const CATALOG_SUBDIVISION = "Florida";

const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - "A".charCodeAt(0);

/**
 * The flag emoji for an alpha-2 code.
 *
 * Derived rather than stored: each letter maps to its regional-indicator
 * symbol, and the pair renders as a flag. Codes that aren't two ASCII letters
 * return an empty string rather than a mojibake pair.
 */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return [...code.toUpperCase()]
    .map((letter) =>
      String.fromCodePoint(letter.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET)
    )
    .join("");
}

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

export function countryName(code: string): string {
  return getCountry(code)?.name ?? code;
}

/** What this country calls a state — "Prefecture" in Japan, "Province" in Canada. */
export function subdivisionLabel(code: string): string {
  return getCountry(code)?.subdivisionLabel ?? "State or Region";
}

/** True when we hold scraped catalogs for this country/subdivision pairing. */
export function hasLocalCatalogs(
  countryCode: string,
  subdivision: string | undefined
): boolean {
  return (
    countryCode === CATALOG_COUNTRY &&
    (subdivision ?? "").trim().toLowerCase() === CATALOG_SUBDIVISION.toLowerCase()
  );
}
