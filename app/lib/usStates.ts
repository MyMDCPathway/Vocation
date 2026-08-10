// USPS state/territory abbreviations, for labeling /schools' state filter.
// Standard, stable postal data — the same class of fact as interests.ts's
// hardcoded BLS major-group names, not anything specific to this app.

export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  PR: "Puerto Rico", VI: "US Virgin Islands", GU: "Guam",
  AS: "American Samoa", MP: "Northern Mariana Islands",
  FM: "Federated States of Micronesia", MH: "Marshall Islands", PW: "Palau",
};

/** Falls back to the bare code for anything not in the table — never a
 *  blank label. */
export function usStateName(code: string): string {
  return US_STATE_NAMES[code.toUpperCase()] ?? code;
}
