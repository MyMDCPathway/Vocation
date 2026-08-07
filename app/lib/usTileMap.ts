// The United States as a grid of equal squares.
//
// A real choropleth of the US is a bad way to compare jobs. Area is the thing
// the eye reads first, so Montana and Wyoming shout while the places that
// actually employ people — New Jersey, Massachusetts, Rhode Island, DC — are
// specks or invisible. For "where is this job concentrated" that's exactly
// backwards.
//
// So every state gets one square of the same size, laid out in roughly the
// right place. It reads as the US at a glance, every state is labelled, and no
// state's importance is decided by its acreage. It also costs no geometry: no
// TopoJSON, no projection, no mapping library — 51 grid coordinates and a CSS
// grid.
//
// `name` matches the BLS area table (data/bls-areas.json) exactly, which is
// what joins these tiles to their figures. Territories are deliberately absent:
// Guam, Puerto Rico and the Virgin Islands are in the BLS table but have no
// natural home on a grid of the fifty states, and inventing one would put them
// somewhere false.

export interface StateTile {
  /** Two-letter postal abbreviation, drawn inside the square. */
  postal: string;
  /** Must match the BLS area name exactly — this is the join key. */
  name: string;
  row: number;
  col: number;
}

export const US_TILE_MAP: StateTile[] = [
  { postal: "AK", name: "Alaska", row: 0, col: 0 },
  { postal: "ME", name: "Maine", row: 0, col: 10 },

  { postal: "VT", name: "Vermont", row: 1, col: 9 },
  { postal: "NH", name: "New Hampshire", row: 1, col: 10 },

  { postal: "WA", name: "Washington", row: 2, col: 0 },
  { postal: "ID", name: "Idaho", row: 2, col: 1 },
  { postal: "MT", name: "Montana", row: 2, col: 2 },
  { postal: "ND", name: "North Dakota", row: 2, col: 3 },
  { postal: "MN", name: "Minnesota", row: 2, col: 4 },
  { postal: "WI", name: "Wisconsin", row: 2, col: 5 },
  { postal: "MI", name: "Michigan", row: 2, col: 6 },
  { postal: "NY", name: "New York", row: 2, col: 8 },
  { postal: "MA", name: "Massachusetts", row: 2, col: 9 },
  { postal: "RI", name: "Rhode Island", row: 2, col: 10 },

  { postal: "OR", name: "Oregon", row: 3, col: 0 },
  { postal: "NV", name: "Nevada", row: 3, col: 1 },
  { postal: "WY", name: "Wyoming", row: 3, col: 2 },
  { postal: "SD", name: "South Dakota", row: 3, col: 3 },
  { postal: "IA", name: "Iowa", row: 3, col: 4 },
  { postal: "IL", name: "Illinois", row: 3, col: 5 },
  { postal: "IN", name: "Indiana", row: 3, col: 6 },
  { postal: "OH", name: "Ohio", row: 3, col: 7 },
  { postal: "PA", name: "Pennsylvania", row: 3, col: 8 },
  { postal: "NJ", name: "New Jersey", row: 3, col: 9 },
  { postal: "CT", name: "Connecticut", row: 3, col: 10 },

  { postal: "CA", name: "California", row: 4, col: 0 },
  { postal: "UT", name: "Utah", row: 4, col: 1 },
  { postal: "CO", name: "Colorado", row: 4, col: 2 },
  { postal: "NE", name: "Nebraska", row: 4, col: 3 },
  { postal: "MO", name: "Missouri", row: 4, col: 4 },
  { postal: "KY", name: "Kentucky", row: 4, col: 5 },
  { postal: "WV", name: "West Virginia", row: 4, col: 6 },
  { postal: "VA", name: "Virginia", row: 4, col: 7 },
  { postal: "MD", name: "Maryland", row: 4, col: 8 },
  { postal: "DE", name: "Delaware", row: 4, col: 9 },

  { postal: "AZ", name: "Arizona", row: 5, col: 1 },
  { postal: "NM", name: "New Mexico", row: 5, col: 2 },
  { postal: "KS", name: "Kansas", row: 5, col: 3 },
  { postal: "AR", name: "Arkansas", row: 5, col: 4 },
  { postal: "TN", name: "Tennessee", row: 5, col: 5 },
  { postal: "NC", name: "North Carolina", row: 5, col: 6 },
  { postal: "SC", name: "South Carolina", row: 5, col: 7 },
  { postal: "DC", name: "District of Columbia", row: 5, col: 8 },

  { postal: "OK", name: "Oklahoma", row: 6, col: 3 },
  { postal: "LA", name: "Louisiana", row: 6, col: 4 },
  { postal: "MS", name: "Mississippi", row: 6, col: 5 },
  { postal: "AL", name: "Alabama", row: 6, col: 6 },
  { postal: "GA", name: "Georgia", row: 6, col: 7 },

  { postal: "HI", name: "Hawaii", row: 7, col: 0 },
  { postal: "TX", name: "Texas", row: 7, col: 3 },
  { postal: "FL", name: "Florida", row: 7, col: 7 },
];

export const TILE_ROWS = 8;
export const TILE_COLS = 11;
