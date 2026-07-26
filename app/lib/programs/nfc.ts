// NFC program catalog.
//
// GENERATED FILE — do not edit by hand.
//
// Source:   https://www.nfc.edu/academics/index.php
// Scraped:  2026-07-26
// Programs: 36 (9 associate, 2 bachelor, 25 certificate)
//
// Cost: not set per-program. This school (like most FCS schools) publishes
// tuition as a single flat per-credit-hour rate for the whole college rather
// than a distinct price per program, so repeating an identical costNote on
// every entry would only be noise.
// NFC has no unified program catalog; entries assembled from the AA/AS/Certificates department hub pages (aa-degree.php, as-degree.php, certificates.php) plus each program's own page where one exists. Several certificates are embedded within a shared department page rather than having their own URL (e.g. the 3 Accounting Technology certificates, the Public Safety Academy cross-over certificates); those share the parent department page as their link.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const NFC_PROGRAMS: SchoolProgram[] = [
  { name: "Associate in Arts", url: "https://www.nfc.edu/academics/departments/aa-degree.php", level: "associate", credential: "A.A." },
  { name: "Associate in Arts - Early Childhood Education Emphasis", url: "https://www.nfc.edu/academics/departments/aa-early-childhood-ed.php", level: "associate", credential: "A.A." },
  { name: "Agribusiness Management (Horticulture Technician)", url: "https://www.nfc.edu/academics/career-and-workforce/agribusiness-management.php", level: "associate", credential: "A.S." },
  { name: "Accounting Technology", url: "https://www.nfc.edu/academics/career-and-workforce/accounting-and-business/accounting-technology.php", level: "associate", credential: "A.S." },
  { name: "Business Administration", url: "https://www.nfc.edu/academics/career-and-workforce/accounting-and-business/business-administration.php", level: "associate", credential: "A.S." },
  { name: "Criminal Justice Technology", url: "https://www.nfc.edu/academics/career-and-workforce/public-safety/criminal-justice-technology.php", level: "associate", credential: "A.S." },
  { name: "Emergency Medical Services", url: "https://www.nfc.edu/academics/career-and-workforce/emergency-medical-services/index.php", level: "associate", credential: "A.S." },
  { name: "Registered Nursing (ADN)", url: "https://www.nfc.edu/academics/career-and-workforce/allied-health/index.php", level: "associate", credential: "A.S." },
  { name: "LPN to RN Bridge Program", url: "https://www.nfc.edu/academics/career-and-workforce/allied-health/index.php", level: "associate", credential: "A.S." },
  { name: "Organizational Management", url: "https://www.nfc.edu/academics/career-and-workforce/accounting-and-business/BAS-OM.php", level: "bachelor", credential: "B.A.S." },
  { name: "Nursing (RN to", url: "https://www.nfc.edu/academics/career-and-workforce/allied-health/BSN.php", level: "bachelor", credential: "B.S." },
  { name: "Accounting Technology Management", url: "https://www.nfc.edu/academics/career-and-workforce/accounting-and-business/accounting-technology.php", level: "certificate", credential: "C.C.C." },
  { name: "Accounting Technology Operations", url: "https://www.nfc.edu/academics/career-and-workforce/accounting-and-business/accounting-technology.php", level: "certificate", credential: "C.C.C." },
  { name: "Accounting Technology Specialist", url: "https://www.nfc.edu/academics/career-and-workforce/accounting-and-business/accounting-technology.php", level: "certificate", credential: "C.C.C." },
  { name: "Business Operations", url: "https://www.nfc.edu/academics/career-and-workforce/accounting-and-business/Business-Certificates.php", level: "certificate", credential: "C.C.C." },
  { name: "Human Resources Administrator", url: "https://www.nfc.edu/academics/career-and-workforce/accounting-and-business/Business-Certificates.php", level: "certificate", credential: "C.C.C." },
  { name: "Criminal Justice Technology Specialist", url: "https://www.nfc.edu/academics/career-and-workforce/public-safety/index.php", level: "certificate", credential: "C.C.C." },
  { name: "Emergency Medical Technician - EMT-Basic", url: "https://www.nfc.edu/academics/career-and-workforce/emergency-medical-services/index.php", level: "certificate", credential: "C.C.C." },
  { name: "Paramedic", url: "https://www.nfc.edu/academics/career-and-workforce/emergency-medical-services/index.php", level: "certificate", credential: "C.C.C." },
  { name: "Certified Production Technology (CPT)", url: "https://www.nfc.edu/academics/career-and-workforce/certified-production-technology/index.php", level: "certificate", credential: "Cert." },
  { name: "Practical Nursing", url: "https://www.nfc.edu/academics/career-and-workforce/allied-health/index.php", level: "certificate", credential: "Cert." },
  { name: "Class A: Tractor Trailer Truck Driver", url: "https://www.nfc.edu/academics/career-and-workforce/cdl/index.php", level: "certificate", credential: "Cert." },
  { name: "Class B: Truck Driver Heavy Florida \"B\"", url: "https://www.nfc.edu/academics/career-and-workforce/cdl/index.php", level: "certificate", credential: "Cert." },
  { name: "Child Care Center Operations", url: "https://www.nfc.edu/academics/career-and-workforce/early-childhood-education/index.php", level: "certificate", credential: "Cert." },
  { name: "Early Childhood Professional Certificate (ECPC)", url: "https://www.nfc.edu/academics/career-and-workforce/early-childhood-education/index.php", level: "certificate", credential: "Cert." },
  { name: "Human Services Generalist", url: "https://www.nfc.edu/academics/career-and-workforce/human-services-generalist.php", level: "certificate", credential: "Cert." },
  { name: "HVAC/R", url: "https://www.nfc.edu/academics/career-and-workforce/hvac-r/index.php", level: "certificate", credential: "Cert." },
  { name: "Industrial Machinery Maintenance 1", url: "https://www.nfc.edu/academics/career-and-workforce/industrial-machinery/index.php", level: "certificate", credential: "Cert." },
  { name: "Industrial Machinery Maintenance 2", url: "https://www.nfc.edu/academics/career-and-workforce/industrial-machinery/index.php", level: "certificate", credential: "Cert." },
  { name: "Welding Program", url: "https://www.nfc.edu/academics/career-and-workforce/Welding/index.php", level: "certificate", credential: "Cert." },
  { name: "Florida Law Enforcement Academy", url: "https://www.nfc.edu/academics/career-and-workforce/public-safety/index.php", level: "certificate", credential: "Cert." },
  { name: "Florida CMS Correctional Basic Recruit Academy", url: "https://www.nfc.edu/academics/career-and-workforce/public-safety/index.php", level: "certificate", credential: "Cert." },
  { name: "Correctional Officer Cross-Over to FL Law Enforcement Academy", url: "https://www.nfc.edu/academics/career-and-workforce/public-safety/index.php", level: "certificate", credential: "Cert." },
  { name: "Law Enforcement Officer Cross-Over to FL CMS Correctional Officer Basic Recruit Academy", url: "https://www.nfc.edu/academics/career-and-workforce/public-safety/index.php", level: "certificate", credential: "Cert." },
  { name: "Correctional Probation Officer Cross-Over to FL Law Enforcement Officer", url: "https://www.nfc.edu/academics/career-and-workforce/public-safety/index.php", level: "certificate", credential: "Cert." },
  { name: "Correctional Probation Officer Cross-Over to FL CMS Correctional Officer", url: "https://www.nfc.edu/academics/career-and-workforce/public-safety/index.php", level: "certificate", credential: "Cert." },
];
