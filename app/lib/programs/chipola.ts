// CHIPOLA program catalog.
//
// GENERATED FILE — do not edit by hand.
//
// Source:   https://www.chipola.edu/studentservices/academic-pathways/ (Academic Pathways)
// Scraped:  2026-07-25
// Programs: 48 (11 associate, 12 bachelor, 25 certificate)
//
// Cost: not set per-program. This school (like most FCS schools) publishes
// tuition as a single flat per-credit-hour rate for the whole college rather
// than a distinct price per program, so repeating an identical costNote on
// every entry would only be noise.
// Links point at Chipola's own PDF pathway guide per program (their own preferred format), not a webpage — that is genuinely how Chipola publishes this. Excludes ~80 partner-university (FAMU/FSU/UF/UWF/UCF) transfer-pathway sheets on the same page, which describe those universities' bachelor's programs, not Chipola's own. The 16 major-specific AA pathway sheets (e.g. 'AA + recommended courses for an English Education transfer') were collapsed into one generic Associate in Arts entry per the project owner — Chipola awards one AA, not major-specific AA degrees.

import { createProgramCatalog, type SchoolProgram } from "@/app/lib/programCatalog";

export const CHIPOLA_PROGRAMS: SchoolProgram[] = [
  { name: "Associate in Arts", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-General-College.pdf", level: "associate", credential: "A.A." },
  { name: "Business Administration", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Business-Administration-AS.pdf", level: "associate", credential: "A.S." },
  { name: "Civil Engineering Technology", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Civil-Engineering-Technology-AS.pdf", level: "associate", credential: "A.S." },
  { name: "Computer Information Technology", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Computer-Information-Technology.pdf", level: "associate", credential: "A.S." },
  { name: "Emergency Medical Services", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/AS-Emergency-Medical-Services.pdf", level: "associate", credential: "A.S." },
  { name: "Engineering Technology", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Engineering-Technology-AS.pdf", level: "associate", credential: "A.S." },
  { name: "Network Systems Technology (Digital Forensics)", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Network-Systems-Technology-(digital-forensics).pdf", level: "associate", credential: "A.S." },
  { name: "Networking Systems Technology (Network Security)", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Network-Systems-Technology-(network-security).pdf", level: "associate", credential: "A.S." },
  { name: "Nursing", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Nursing-AS.pdf", level: "associate", credential: "A.S." },
  { name: "Sports, Fitness, & Recreation Management", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Sports-Fitness-and-Rec-Management.pdf", level: "associate", credential: "A.S." },
  { name: "Theatre and Entertainment Technology", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Theatre-and-Entertainment-Technology.pdf", level: "associate", credential: "A.S." },
  { name: "Business Administration: Accounting Concentration", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Business-Admin-Accounting.pdf", level: "bachelor", credential: "B.S." },
  { name: "Business Administration: Engineering Management Concentration", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Business-Admin-Engineering-Management.pdf", level: "bachelor", credential: "B.S." },
  { name: "Business Administration: Information Systems", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Business-Admin-Information-Systems.pdf", level: "bachelor", credential: "B.S." },
  { name: "Business Administration: Management Concentration", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-business-Admin-Managment.pdf", level: "bachelor", credential: "B.S." },
  { name: "Elementary Education", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Elementary-Education.pdf", level: "bachelor", credential: "B.S." },
  { name: "English Education (6-12)", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-English-Education.pdf", level: "bachelor", credential: "B.S." },
  { name: "Exceptional Student Education", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Exceptional-Student-Education.pdf", level: "bachelor", credential: "B.S." },
  { name: "Middle School Mathematics (5-9)", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Middle-School-Mathematics-Ed-(5-9).pdf", level: "bachelor", credential: "B.S." },
  { name: "Middle School Science (5-9)", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Middle-School-science-Ed-(5-9).pdf", level: "bachelor", credential: "B.S." },
  { name: "Secondary Education Mathematics (6-12)", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Secondary-Education-Mathematics.pdf", level: "bachelor", credential: "B.S." },
  { name: "Secondary Education Biology (6-12)", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Secondary-Ed-biology.pdf", level: "bachelor", credential: "B.S." },
  { name: "Nursing - RN to", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-Nursing-RN-to-BSN.pdf", level: "bachelor", credential: "B.S." },
  { name: "Child Care Center Management", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Childcare-Center-Management.pdf", level: "certificate", credential: "C.C.C." },
  { name: "Digital Forensics", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Digital-Forensics.pdf", level: "certificate", credential: "C.C.C." },
  { name: "Engineering Tech Support Specialist", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Engineering-Technology-Support-Specialist.pdf", level: "certificate", credential: "C.C.C." },
  { name: "IT Support Specialist", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/IT-Support-Specialist.pdf", level: "certificate", credential: "C.C.C." },
  { name: "Network Security", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Network-Security.pdf", level: "certificate", credential: "C.C.C." },
  { name: "Paramedic", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Paramedic.pdf", level: "certificate", credential: "C.C.C." },
  { name: "Pneumatics, Hydraulics, and Motors", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Pneumatics,-Hydraulics-and-Motors.pdf", level: "certificate", credential: "C.C.C." },
  { name: "Advanced Manufacturing and Production Technologies", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Adv-Manufacturing-and-Production-Tech.pdf", level: "certificate", credential: "Cert." },
  { name: "Building Construction Technologies", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Building-Construction-Technologies.pdf", level: "certificate", credential: "Cert." },
  { name: "Correctional Officer", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Correctional-Officer.pdf", level: "certificate", credential: "Cert." },
  { name: "Cosmetology", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Cosmetology.pdf", level: "certificate", credential: "Cert." },
  { name: "Cross-Over Correctional Officer to Law Enforcement", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Crossover-to-Law-Enforcement.pdf", level: "certificate", credential: "Cert." },
  { name: "Electricity", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Electricity.pdf", level: "certificate", credential: "Cert." },
  { name: "Fire Fighter/Emergency Medical Tech - Combined", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Firefighter-EMT-combined-Academic-Pathway.pdf", level: "certificate", credential: "Cert." },
  { name: "Fire Fighter", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Firefighter.pdf", level: "certificate", credential: "Cert." },
  { name: "Heating, Ventilation, Air-Conditioning/Refrigeration (HVAC/R)", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/HVAC.pdf", level: "certificate", credential: "Cert." },
  { name: "Law Enforcement Officer", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Law-Enforcement-Officer.pdf", level: "certificate", credential: "Cert." },
  { name: "Master Automotive Service Technology 1", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Master-Automotive-Service-Technology-1.pdf", level: "certificate", credential: "Cert." },
  { name: "Master Automotive Service Technology 2", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Master-Automotive-Service-Technology-2.pdf", level: "certificate", credential: "Cert." },
  { name: "Nursing Assistant (Long Term Care)", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Nursing-Assistant-(Long-Term-Care).pdf", level: "certificate", credential: "Cert." },
  { name: "Plumbing", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Plumbing.pdf", level: "certificate", credential: "Cert." },
  { name: "Practical Nursing", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Practical-Nursing.pdf", level: "certificate", credential: "Cert." },
  { name: "Welding Technologies", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Welding-Technologies.pdf", level: "certificate", credential: "Cert." },
  { name: "Welding Technologies - Advanced", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/Welding-Technologies---Advanced.pdf", level: "certificate", credential: "Cert." },
  { name: "Emergency Medical Technician Certificate", url: "https://www.chipola.edu/media/chipola/student-life/student-services/academic-pathways/CC-EMT-CERT.pdf", level: "certificate", credential: "A.T.D." },
];
