// Florida university transfer options shown on generated pathways.

export interface UniversityInfo {
  name: string;
  website: string;
  location: string;
  type: string; // "Public" or "Private"
  notes?: string;
  // Approximate annual in-state tuition & fees (USD). Used to estimate the
  // cost of a bachelor's completed at this university after transfer.
  annualCost: { low: number; high: number };
}

export const FLORIDA_UNIVERSITIES: UniversityInfo[] = [
  {
    name: "University of Florida (UF)",
    website: "https://www.ufl.edu/",
    location: "Gainesville",
    type: "Public",
    notes: "Flagship state university, strong articulation agreements with MDC",
    annualCost: { low: 6400, high: 6900 },
  },
  {
    name: "Florida State University (FSU)",
    website: "https://www.fsu.edu/",
    location: "Tallahassee",
    type: "Public",
    notes: "Major research university, excellent transfer pathways",
    annualCost: { low: 6500, high: 7000 },
  },
  {
    name: "University of South Florida (USF)",
    website: "https://www.usf.edu/",
    location: "Tampa",
    type: "Public",
    notes: "Multiple campuses, strong engineering and business programs",
    annualCost: { low: 6400, high: 6900 },
  },
  {
    name: "Florida International University (FIU)",
    website: "https://www.fiu.edu/",
    location: "Miami",
    type: "Public",
    notes: "Local option in Miami, strong transfer agreements with MDC",
    annualCost: { low: 6500, high: 7000 },
  },
  {
    name: "University of Central Florida (UCF)",
    website: "https://www.ucf.edu/",
    location: "Orlando",
    type: "Public",
    notes:
      "Largest university in Florida, excellent engineering and hospitality programs",
    annualCost: { low: 6400, high: 6900 },
  },
  {
    name: "Florida Atlantic University (FAU)",
    website: "https://www.fau.edu/",
    location: "Boca Raton",
    type: "Public",
    notes:
      "Multiple campuses in South Florida, strong business and engineering programs",
    annualCost: { low: 6100, high: 6600 },
  },
  {
    name: "Florida A&M University (FAMU)",
    website: "https://www.famu.edu/",
    location: "Tallahassee",
    type: "Public",
    notes:
      "Historically Black University, strong programs in pharmacy and engineering",
    annualCost: { low: 5800, high: 6300 },
  },
  {
    name: "University of North Florida (UNF)",
    website: "https://www.unf.edu/",
    location: "Jacksonville",
    type: "Public",
    notes: "Strong business and health sciences programs",
    annualCost: { low: 6400, high: 6900 },
  },
  {
    name: "Florida Gulf Coast University (FGCU)",
    website: "https://www.fgcu.edu/",
    location: "Fort Myers",
    type: "Public",
    notes: "Growing university with strong environmental and business programs",
    annualCost: { low: 6100, high: 6600 },
  },
  {
    name: "University of West Florida (UWF)",
    website: "https://uwf.edu/",
    location: "Pensacola",
    type: "Public",
    notes: "Strong programs in business, education, and health sciences",
    annualCost: { low: 6300, high: 6800 },
  },
  {
    name: "New College of Florida",
    website: "https://www.ncf.edu/",
    location: "Sarasota",
    type: "Public",
    notes: "Small liberal arts honors college, unique academic structure",
    annualCost: { low: 6900, high: 7400 },
  },
  {
    name: "Florida Polytechnic University",
    website: "https://www.floridapoly.edu/",
    location: "Lakeland",
    type: "Public",
    notes:
      "STEM-focused university, strong engineering and technology programs",
    annualCost: { low: 4900, high: 5400 },
  },
  {
    name: "University of Miami",
    website: "https://welcome.miami.edu/",
    location: "Coral Gables",
    type: "Private",
    notes: "Private research university, strong programs across disciplines",
    annualCost: { low: 57000, high: 62000 },
  },
  {
    name: "Nova Southeastern University (NSU)",
    website: "https://www.nova.edu/",
    location: "Fort Lauderdale",
    type: "Private",
    notes: "Private university with strong health sciences and law programs",
    annualCost: { low: 34000, high: 38000 },
  },
  {
    name: "Florida Institute of Technology (FIT)",
    website: "https://www.fit.edu/",
    location: "Melbourne",
    type: "Private",
    notes:
      "STEM-focused private university, strong engineering and aviation programs",
    annualCost: { low: 43000, high: 47000 },
  },
  {
    name: "Rollins College",
    website: "https://www.rollins.edu/",
    location: "Winter Park",
    type: "Private",
    notes: "Private liberal arts college, strong business and arts programs",
    annualCost: { low: 55000, high: 60000 },
  },
  {
    name: "Stetson University",
    website: "https://www.stetson.edu/",
    location: "DeLand",
    type: "Private",
    notes: "Private university, strong programs in business, law, and music",
    annualCost: { low: 51000, high: 56000 },
  },
  {
    name: "Barry University",
    website: "https://www.barry.edu/",
    location: "Miami Shores",
    type: "Private",
    notes:
      "Private Catholic university, strong health sciences and education programs",
    annualCost: { low: 30000, high: 34000 },
  },
  {
    name: "St. Thomas University",
    website: "https://www.stu.edu/",
    location: "Miami Gardens",
    type: "Private",
    notes: "Private Catholic university, strong business and law programs",
    annualCost: { low: 31000, high: 35000 },
  },
  {
    name: "Lynn University",
    website: "https://www.lynn.edu/",
    location: "Boca Raton",
    type: "Private",
    notes: "Private university, strong hospitality and business programs",
    annualCost: { low: 38000, high: 42000 },
  },
];
