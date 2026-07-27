// Lynn University degree catalog: program name -> official catalog page.
//
// HAND-VERIFIED, not scraped — no committed scraper exists for this school.
// lynn.edu is behind Cloudflare bot protection (a different mechanism than
// the AWS WAF Bot Control seen on FAMU/FlPoly/USF/Rollins/Flagler/FIT/PBA/
// Saint Leo, but the same net effect): every plain fetch()/curl request to
// the domain — even the bare homepage — returns HTTP 403 "Attention
// Required! | Cloudflare", while a real browser's top-level navigation gets
// through cleanly. Same resolution as those Acalog sites: navigate with a
// real browser and read the rendered DOM by hand (2026-07-27).
//
// Lynn's own catalog (lynn.edu/academics/catalog, a bespoke site, not
// CourseLeaf/Acalog/SmartCatalogIQ) has no single flat program-index page,
// but every page shares one server-rendered left-nav menu that itself lists
// every program in the entire catalog — undergraduate day, online, and
// graduate divisions across all 6 colleges — each as a real link with its
// own credential shown as a styled subtitle span. That nav menu, not any
// particular page's main content, is the source of this file: read via
// `document.querySelectorAll('a[href*="/academics/catalog/academics/programs/"]')`
// on https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/arts-and-sciences
// (any catalog page would have shown the same menu).
//
// Associate-level programs (7: Aviation, Applied Science, Behavioral
// Science, Business Administration, Elementary Education Grades K-6,
// Advertising and Public Relations, Graphic Design) and the one
// certificate (Professional Performance Certificate) are excluded — the
// same call UCF's/ERAU's/Barry's scrapers made: this app's university
// template starts every pathway at the bachelor's, so a level below that
// isn't a fit for the shape. Where the on-campus ("undergraduate-day") and
// "online" divisions offer the identical major, only one copy is kept
// (first seen) — same dedupe-by-name+level convention every other school's
// scraper already uses; the two divisions differ in delivery format, not in
// what a pathway step should say.
//
// A few program names (e.g. "Aviation Operations", "Biology") don't state
// their own credential the way most of this file's names do (e.g. "Master
// of Science in Psychology"); those use the separate `credential` field so
// programList() in pathwayPrompts.ts prints "Aviation Operations (Bachelor
// of Science)" instead of a bare, level-ambiguous name.
//
// If Lynn changes its catalog, re-verify by hand — a plain scraper cannot
// reach this site. Programs: 64 (37 bachelor, 27 graduate).

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const LYNN_PROGRAMS: SchoolProgram[] = [
  { name: "Advertising and Public Relations", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/communication-and-design/advertising-public-relations-ba", level: "bachelor", area: "College of Communication and Design", credential: "Bachelor of Arts" },
  { name: "Aviation Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/aviation-management", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Aviation Operations", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/aeronautics/aviation-operations", level: "bachelor", area: "College of Aeronautics", credential: "Bachelor of Science" },
  { name: "Biology", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/arts-and-sciences/biology", level: "bachelor", area: "College of Arts and Sciences", credential: "Bachelor of Science" },
  { name: "Business Administration", url: "https://www.lynn.edu/academics/catalog/academics/programs/online/business-and-management/business-administration", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Communication", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/communication-and-design/communication", level: "bachelor", area: "College of Communication and Design", credential: "Bachelor of Arts" },
  { name: "Composition", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/conservatory/composition", level: "bachelor", area: "Conservatory of Music", credential: "Bachelor of Music" },
  { name: "Computer Animation", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/communication-and-design/computer-animation", level: "bachelor", area: "College of Communication and Design", credential: "Bachelor of Fine Arts" },
  { name: "Criminal Justice", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/arts-and-sciences/criminal-justice", level: "bachelor", area: "College of Arts and Sciences", credential: "Bachelor of Arts" },
  { name: "Cybersecurity", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/cybersecurity", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Data Analytics", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/data-analytics", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Drama", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/arts-and-sciences/drama-bfa", level: "bachelor", area: "College of Arts and Sciences", credential: "Bachelor of Fine Arts" },
  { name: "Early Childhood Education", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/education/early-childhood-education", level: "bachelor", area: "College of Education", credential: "Bachelor of Science" },
  { name: "Elementary Education Grades K-6", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/education/elementary-education-k-6", level: "bachelor", area: "College of Education", credential: "Bachelor of Science" },
  { name: "Entrepreneurship", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/entrepreneurship", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Fashion and Retail", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/fashion-and-retail", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Film Production", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/communication-and-design/film-production-bfa", level: "bachelor", area: "College of Communication and Design", credential: "Bachelor of Fine Arts" },
  { name: "Forensic Investigations", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/arts-and-sciences/forensic-investigations", level: "bachelor", area: "College of Arts and Sciences", credential: "Bachelor of Science" },
  { name: "Graphic Design", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/communication-and-design/graphic-design-bfa", level: "bachelor", area: "College of Communication and Design", credential: "Bachelor of Fine Arts" },
  { name: "Healthcare Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/healthcare-management", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Hospitality Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/hospitality-management", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Human Resources Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/online/business-and-management/human-resources", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "International Business Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/international-business-management", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Liberal Arts", url: "https://www.lynn.edu/academics/catalog/academics/programs/online/arts-and-sciences/liberal-arts-ba", level: "bachelor", area: "College of Arts and Sciences", credential: "Bachelor of Arts" },
  { name: "Marketing", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/marketing", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Multimedia Journalism", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/communication-and-design/multimedia-journalism", level: "bachelor", area: "College of Communication and Design", credential: "Bachelor of Arts" },
  { name: "Performance: Piano", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/conservatory/performance-piano", level: "bachelor", area: "Conservatory of Music", credential: "Bachelor of Music" },
  { name: "Performance: Strings, Winds, Brass, Harp & Percussion", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/conservatory/strings-winds-brass-harp-percussion", level: "bachelor", area: "Conservatory of Music", credential: "Bachelor of Music" },
  { name: "Political Science", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/arts-and-sciences/political-science", level: "bachelor", area: "College of Arts and Sciences", credential: "Bachelor of Arts" },
  { name: "Professional Pilot", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/aeronautics/professional-pilot", level: "bachelor", area: "College of Aeronautics", credential: "Bachelor of Science" },
  { name: "Professional Studies", url: "https://www.lynn.edu/academics/catalog/academics/programs/online/business-and-management/professional-studies", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Psychology", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/arts-and-sciences/psychology", level: "bachelor", area: "College of Arts and Sciences", credential: "Bachelor of Science" },
  { name: "Social Impact and Entrepreneurship", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/social-entrepreneurship", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Sports Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/sports-management", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Strategic Communication", url: "https://www.lynn.edu/academics/catalog/academics/programs/online/communication-and-design/communication-and-media", level: "bachelor", area: "College of Communication and Design", credential: "Bachelor of Arts" },
  { name: "Visual Art and Design", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/communication-and-design/visual-art-design", level: "bachelor", area: "College of Communication and Design", credential: "Bachelor of Fine Arts" },
  { name: "Wealth Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/undergraduate-day/business-and-management/investment-management", level: "bachelor", area: "College of Business and Management", credential: "Bachelor of Science" },
  { name: "Digital Media", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/communication-and-design/communication-and-media/digital-media", level: "graduate", area: "College of Communication and Design", credential: "Master of Science" },
  { name: "Doctorate of Education: Educational Leadership", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/education/doctorate-of-education/educational-leadership-edd", level: "graduate", area: "College of Education" },
  { name: "Master of Business Administration in Aviation Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/aviation-management", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Business Administration in Entrepreneurial Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/entrepreneurial-management", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Business Administration in Healthcare Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/healthcare-management", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Business Administration in Hospitality Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/hospitality-management", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Business Administration in Human Resource Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/human-resource-management", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Business Administration in International Business Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/international-business-management", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Business Administration in Leadership & Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/leadership-management", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Business Administration in Marketing", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/marketing", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Business Administration in Sports Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/sports-management", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Business Administration, Financial Valuation and Investment Management", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/business-and-management/mba-specializations/financial-valuation-investment-management", level: "graduate", area: "College of Business and Management" },
  { name: "Master of Education (M.Ed.) in Exceptional Student Education", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/education/exceptional-student-education", level: "graduate", area: "College of Education" },
  { name: "Master of Education in Educational Leadership (M.Ed.)", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/education/educational-leadership-med", level: "graduate", area: "College of Education" },
  { name: "Master of Fine Arts in Virtual Production and Visual Effects Animation", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/communication-and-design/visual-effects-animation", level: "graduate", area: "College of Communication and Design" },
  { name: "Master of Music in Composition", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/conservatory/composition", level: "graduate", area: "Conservatory of Music" },
  { name: "Master of Music in Instrumental Collaborative Piano", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/conservatory/instrumental-collaborative-piano", level: "graduate", area: "Conservatory of Music" },
  { name: "Master of Music in Performance for Pianist", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/conservatory/master-of-music-performance/pianists", level: "graduate", area: "Conservatory of Music" },
  { name: "Master of Music in Performance for Strings, Winds, Brass, Harp and Percussion", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/conservatory/master-of-music-performance/strings-winds-brass-harp-percussion", level: "graduate", area: "Conservatory of Music" },
  { name: "Master of Public Administration", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/arts-and-sciences/master-of-public-administration", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science in Biological Sciences", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/arts-and-sciences/master-of-science-in-biological-studies", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science in Clinical Mental Health Counseling", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/arts-and-sciences/clinical-mental-health-counseling-2", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science in Criminal Justice", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/arts-and-sciences/criminal-justice", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science in Psychology", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/arts-and-sciences/psychology", level: "graduate", area: "College of Arts and Sciences" },
  { name: "Master of Science in User Experience (UX) Design", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/communication-and-design/user-experience-design", level: "graduate", area: "College of Communication and Design" },
  { name: "Media Studies and Practice", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/communication-and-design/communication-and-media/media-studies-and-practice", level: "graduate", area: "College of Communication and Design", credential: "Master of Science" },
  { name: "Strategic Communication", url: "https://www.lynn.edu/academics/catalog/academics/programs/graduate/communication-and-design/communication-and-media/strategic-communication", level: "graduate", area: "College of Communication and Design", credential: "Master of Science" },
];

// Lynn is a four-year university, so an unqualified program name should
// resolve to the bachelor's rather than the graduate program of the same name.
export const lynnCatalog = createProgramCatalog(LYNN_PROGRAMS, { preferred: "bachelor" });
