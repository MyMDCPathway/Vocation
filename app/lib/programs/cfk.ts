// CFK program catalog.
//
// GENERATED FILE — do not edit by hand.
//
// Source:   https://www.cfk.edu/academics/academic-departments/ (Academic Departments, visited individually — CFK has no catalog site)
// Scraped:  2026-07-26
// Programs: 11 (8 associate, 3 bachelor)
//
// Cost: not set per-program. This school (like most FCS schools) publishes
// tuition as a single flat per-credit-hour rate for the whole college rather
// than a distinct price per program, so repeating an identical costNote on
// every entry would only be noise.
// CFK is a very small college: of its 14 listed academic departments, 2 (Entrepreneurship Incubator Lab, Science and Research) turned out to be workshops/scholarship programs rather than degrees, and Supervision & Management is cross-listed under both Business Administration and Hospitality/Ecotourism (one program, kept once). The Associate in Arts has no dedicated page of its own; it points at the General Studies department page, which is the AA's actual description page.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const CFK_PROGRAMS: SchoolProgram[] = [
  { name: "Associate in Arts", url: "https://www.cfk.edu/academics/academic-departments/general-studies-universtiy-transfer/", level: "associate", credential: "A.A." },
  { name: "Culinary Management", url: "https://www.cfk.edu/academics/academic-departments/culinary-management/as-culinary-management/", level: "associate", credential: "A.S." },
  { name: "Emergency Medical Services", url: "https://www.cfk.edu/academics/academic-departments/allied-health-and-nursing/asems/", level: "associate", credential: "A.S." },
  { name: "Engineering Technology - Renewable Energy Technician", url: "https://www.cfk.edu/academics/academic-departments/engineering-technology-renewable-energy/", level: "associate", credential: "A.S." },
  { name: "Criminal Justice Technology", url: "https://www.cfk.edu/academics/academic-departments/institute-for-public-safety/as-cjt/", level: "associate", credential: "A.S." },
  { name: "Nursing", url: "https://www.cfk.edu/academics/academic-departments/allied-health-and-nursing/as-nursing/", level: "associate", credential: "A.S." },
  { name: "Diving Business Technology", url: "https://www.cfk.edu/academics/academic-departments/james-e-lockwood-jr-school-of-diving-and-underwater-technology/aas-diving-business-technology/", level: "associate", credential: "A.A.S." },
  { name: "Marine Engineering, Management, & Seamanship", url: "https://www.cfk.edu/academics/academic-departments/marine-engineering-management-and-seamanship/aas-mems/", level: "associate", credential: "A.A.S." },
  { name: "Supervision & Management", url: "https://www.cfk.edu/academics/academic-departments/business-administration/bachelor-of-appliead-science-in-supervision-and-management/", level: "bachelor", credential: "B.A.S." },
  { name: "Exceptional Student Education", url: "https://www.cfk.edu/education/bs-ese/", level: "bachelor", credential: "B.S." },
  { name: "Marine Resource Management", url: "https://www.cfk.edu/academics/academic-departments/marine-science/bs-mrm/", level: "bachelor", credential: "B.S." },
];
