"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// SVG Icons
const icons = {
  degree: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.747 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  transfer: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  ),
  internship: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  exam: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

interface PathwayStep {
  type: "degree" | "transfer" | "internship" | "exam";
  level: string;
  name: string;
  description: string;
}

interface PathwayOption {
  title: string;
  isPrimary: boolean;
  steps: PathwayStep[];
}

interface PathwayData {
  title: string;
  pathways: PathwayOption[];
}

interface CareerPathway {
  career: string;
  data: PathwayData;
  selectedPathwayIndex: number;
}

// Mapping of MDC bachelor's programs to their exact URLs
// Key: program name (normalized for matching), Value: exact URL
const MDC_BACHELORS_URL_MAPPING: Record<string, string> = {
  // Benjamin León School of Nursing
  "bachelor of science in nursing": "https://www.mdc.edu/bsn/",
  "bachelor of science in nursing (rn to bsn)": "https://www.mdc.edu/bsn/",
  "rn to bsn": "https://www.mdc.edu/bsn/",

  // Miguel B. Fernandez Family School of Global Business, Trade and Transportation
  "bachelor of applied sciences in leadership and management innovation":
    "https://www.mdc.edu/leadershipandmanagementinnovation/",
  "leadership and management innovation - accounting":
    "https://www.mdc.edu/accountingmanagement/",
  "leadership and management innovation - hospitality management":
    "https://www.mdc.edu/hospitalitymanagement/",
  "leadership and management innovation - human resource management":
    "https://www.mdc.edu/humanresourcemanagement/",
  "leadership and management innovation - digital marketing concentration":
    "https://www.mdc.edu/digitalmarketingbas/",
  "bachelor of applied sciences in supply chain management":
    "https://www.mdc.edu/supplychainmanagement/",
  "supply chain management – procurement management":
    "https://www.mdc.edu/procurement-management/",
  "supply chain management – project management":
    "https://www.mdc.edu/project-management/",
  "supply chain management – supply chain analytics":
    "https://www.mdc.edu/supplychainanalytics/",

  // School of Education
  "bachelor of science in early childhood education":
    "https://www.mdc.edu/earlychildhood/",
  "bachelor of science in exceptional student education":
    "https://www.mdc.edu/ese/",
  "bachelor of science in exceptional student education (k-12)":
    "https://www.mdc.edu/ese/",
  "bachelor of science in secondary mathematics education":
    "https://www.mdc.edu/secondarymath/",
  "bachelor of science in secondary science education - biology":
    "https://www.mdc.edu/secondarybiology/",

  // School of Engineering, Technology, and Design
  "bachelor of science in applied artificial intelligence":
    "https://www.mdc.edu/appliedaibs/",
  "bachelor of science in cybersecurity":
    "https://www.mdc.edu/cybersecuritybs/",
  "bachelor of science in data analytics": "https://www.mdc.edu/dataanalytics/",
  "bachelor of science in electrical and computer engineering technology":
    "https://www.mdc.edu/electronicsengineeringbs/",
  "bachelor of applied science in film, television & digital production":
    "https://www.mdc.edu/filmtvproduction/",
  "bachelor of science in information systems technology – networking":
    "https://www.mdc.edu/informationsystemsnetworking/",
  "bachelor of science in information systems technology – software engineering":
    "https://www.mdc.edu/softwareengineering/",

  // School of Health Sciences
  "bachelor of applied sciences in health sciences – clinical laboratory science":
    "https://www.mdc.edu/medicallaboratorysciences/",
  "bachelor of applied sciences in health sciences – histotechnology":
    "https://www.mdc.edu/histotechnologybas/",
  "bachelor of applied sciences in health sciences – physician assistant studies":
    "https://www.mdc.edu/physicianassistant/",

  // School of Justice, Public Safety, and Law Studies
  "bachelor of applied sciences in public safety management – crime scene investigation":
    "https://www.mdc.edu/csi/",
  "bachelor of applied sciences in public safety management – emergency management":
    "https://www.mdc.edu/emergencymanagement/",
  "bachelor of applied sciences in criminal justice":
    "https://www.mdc.edu/criminaljusticebas/",

  // School of Science
  "bachelor of science in biological sciences – biopharmaceutical sciences":
    "https://www.mdc.edu/biopharmaceutical/",
  "bachelor of science in biological sciences – biotechnology":
    "https://www.mdc.edu/biotechnology/",
  "bachelor of science in biological sciences – science education":
    "https://www.mdc.edu/scienceeducation/",
};

// Helper function to check if a program is an MDC bachelor's program
function isMDCBachelorsProgram(programName: string): boolean {
  const normalizedName = programName.toLowerCase().trim();
  // Check if any key in the mapping matches the program name
  return Object.keys(MDC_BACHELORS_URL_MAPPING).some((key) =>
    normalizedName.includes(key)
  );
}

// Helper function to get the exact URL for an MDC bachelor's program
function getMDCBachelorsProgramUrl(programName: string): string | null {
  const normalizedName = programName.toLowerCase().trim();

  // Try to find an exact or partial match
  for (const [key, url] of Object.entries(MDC_BACHELORS_URL_MAPPING)) {
    if (normalizedName.includes(key)) {
      return url;
    }
  }

  return null;
}

// Helper function to extract the first program option when multiple are listed
// Handles patterns like: "Engineering - Mechanical or Civil" or "Biology or Chemistry"
function extractFirstProgramOption(programName: string): string {
  // Check for common separators: " or ", " and ", ", "
  const separators = [/\s+or\s+/i, /\s+and\s+/i, /,\s+/];

  for (const separator of separators) {
    if (separator.test(programName)) {
      // Split and take the first option
      const parts = programName.split(separator);
      if (parts.length > 1) {
        // Return the first part, which should be the first program option
        return parts[0].trim();
      }
    }
  }

  // If no separator found, return the original name
  return programName.trim();
}

// Mapping of MDC Associate in Arts (A.A.) programs to their exact URLs
const MDC_ASSOCIATE_ARTS_URL_MAPPING: Record<string, string> = {
  accounting: "https://www.mdc.edu/accounting/",
  agriculture: "https://www.mdc.edu/agriculture",
  anthropology: "https://www.mdc.edu/anthropology",
  architecture: "https://www.mdc.edu/architectureaa/",
  "area & ethnic studies": "https://www.mdc.edu/ethnicstudies",
  "ethnic studies": "https://www.mdc.edu/ethnicstudies",
  art: "https://www.mdc.edu/art",
  "art education": "https://www.mdc.edu/art",
  "atmospheric science & meteorology": "https://www.mdc.edu/meteorology",
  meteorology: "https://www.mdc.edu/meteorology",
  biology: "https://www.mdc.edu/biology/",
  biotechnology: "https://www.mdc.edu/biotechnologyaa/",
  "building construction": "https://www.mdc.edu/buildingconstruction",
  "business administration": "https://www.mdc.edu/businessadministration/",
  chemistry: "https://www.mdc.edu/chemistry",
  "computer arts animation": "https://www.mdc.edu/animation/",
  animation: "https://www.mdc.edu/animation/",
  "computer information systems": "https://www.mdc.edu/cis",
  "computer science": "https://www.mdc.edu/computerscience",
  "criminal justice administration": "https://www.mdc.edu/criminaljustice/",
  "criminal justice": "https://www.mdc.edu/criminaljustice/",
  dance: "https://www.mdc.edu/dance",
  dietetics: "https://www.mdc.edu/dietetics",
  drama: "https://www.mdc.edu/drama",
  "drama education": "https://www.mdc.edu/drama",
  economics: "https://www.mdc.edu/economics/",
  "engineering - architectural": "https://www.mdc.edu/architecturalengineering",
  "architectural engineering": "https://www.mdc.edu/architecturalengineering",
  "engineering - biomedical": "https://www.mdc.edu/engineeringscience",
  "biomedical engineering": "https://www.mdc.edu/engineeringscience",
  "engineering - chemical": "https://www.mdc.edu/chemicalengineering",
  "chemical engineering": "https://www.mdc.edu/chemicalengineering",
  "engineering - civil": "https://www.mdc.edu/civilengineering",
  "civil engineering": "https://www.mdc.edu/civilengineering",
  "engineering - computer": "https://www.mdc.edu/computerengineering",
  "computer engineering": "https://www.mdc.edu/computerengineering",
  "engineering - electrical": "https://www.mdc.edu/electricalengineering",
  "electrical engineering": "https://www.mdc.edu/electricalengineering",
  "engineering - geomatics (surveying and mapping)":
    "https://www.mdc.edu/geomatics",
  "engineering - geomatics": "https://www.mdc.edu/geomatics",
  "surveying and mapping": "https://www.mdc.edu/geomatics",
  "engineering - industrial": "https://www.mdc.edu/industrialengineering",
  "industrial engineering": "https://www.mdc.edu/industrialengineering",
  "engineering - mechanical": "https://www.mdc.edu/mechanicalengineering",
  "mechanical engineering": "https://www.mdc.edu/mechanicalengineering",
  "engineering - ocean": "https://www.mdc.edu/oceanengineering",
  "ocean engineering": "https://www.mdc.edu/oceanengineering",
  "english/literature & english education":
    "https://www.mdc.edu/englishliterature",
  "english literature": "https://www.mdc.edu/englishliterature",
  "english education": "https://www.mdc.edu/englishliterature",
  "environmental sciences": "https://www.mdc.edu/environmentalsciences/",
  "exercise science": "https://www.mdc.edu/exercisescience",
  "foreign language": "https://www.mdc.edu/foreignlanguage",
  forestry: "https://www.mdc.edu/forestry",
  geology: "https://www.mdc.edu/geology",
  "graphic or commercial arts": "https://www.mdc.edu/graphiccommercialarts",
  "graphic arts": "https://www.mdc.edu/graphiccommercialarts",
  "commercial arts": "https://www.mdc.edu/graphiccommercialarts",
  "health services administration":
    "https://www.mdc.edu/healthservicesadministration",
  history: "https://www.mdc.edu/history",
  "hospitality administration/travel & tourism":
    "https://www.mdc.edu/hospitalityadministration/",
  "hospitality administration":
    "https://www.mdc.edu/hospitalityadministration/",
  "travel & tourism": "https://www.mdc.edu/hospitalityadministration/",
  "interior design": "https://www.mdc.edu/interiordesign/",
  "international relations": "https://www.mdc.edu/internationalrelations/",
  "landscape architecture": "https://www.mdc.edu/landscape",
  "mass communications/journalism": "https://www.mdc.edu/journalism/",
  "mass communications": "https://www.mdc.edu/journalism/",
  journalism: "https://www.mdc.edu/journalism/",
  mathematics: "https://www.mdc.edu/mathematics",
  music: "https://www.mdc.edu/music",
  "music education": "https://www.mdc.edu/music",
  philosophy: "https://www.mdc.edu/philosophy",
  "physical education teaching & coaching":
    "https://www.mdc.edu/physicaleducation",
  "physical education": "https://www.mdc.edu/physicaleducation",
  physics: "https://www.mdc.edu/physics",
  "political science": "https://www.mdc.edu/politicalscience",
  "pre-bachelor of arts": "https://www.mdc.edu/prebachelor",
  "pre-bachelor": "https://www.mdc.edu/prebachelor",
  "pre-law": "https://www.mdc.edu/prelaw",
  "pre-medical science/dentistry": "https://www.mdc.edu/predentistry",
  "pre-dentistry": "https://www.mdc.edu/predentistry",
  "pre-medical technology": "https://www.mdc.edu/premed",
  "pre-med": "https://www.mdc.edu/premed",
  "pre-nursing": "https://www.mdc.edu/prenursing",
  "pre-occupational therapy": "https://www.mdc.edu/preoccupationaltherapy",
  "pre-optometry": "https://www.mdc.edu/preoptometry",
  "pre-pharmacy": "https://www.mdc.edu/prepharmacy",
  "pre-physical therapy": "https://www.mdc.edu/prephysicaltherapy",
  "pre-veterinary medicine": "https://www.mdc.edu/prevet",
  "pre-vet": "https://www.mdc.edu/prevet",
  psychology: "https://www.mdc.edu/psychology/",
  "public administration": "https://www.mdc.edu/publicadministration",
  recreation: "https://www.mdc.edu/recreation",
  religion: "https://www.mdc.edu/religion",
  "social work": "https://www.mdc.edu/socialwork",
  sociology: "https://www.mdc.edu/sociology/",
  "speech pathology & audiology": "https://www.mdc.edu/speechpathology",
  "speech pathology": "https://www.mdc.edu/speechpathology",
  audiology: "https://www.mdc.edu/speechpathology",
  "teaching (elementary)": "https://www.mdc.edu/teachingelementary",
  "teaching elementary": "https://www.mdc.edu/teachingelementary",
  "teaching (exceptional student education)":
    "https://www.mdc.edu/teachingexceptionalstudent",
  "teaching exceptional student education":
    "https://www.mdc.edu/teachingexceptionalstudent",
  "teaching (pre-elementary/early childhood)":
    "https://www.mdc.edu/teachingearlychildhood",
  "teaching early childhood": "https://www.mdc.edu/teachingearlychildhood",
  "pre-elementary": "https://www.mdc.edu/teachingearlychildhood",
  "teaching (secondary)": "https://www.mdc.edu/teachingsecondary",
  "teaching secondary": "https://www.mdc.edu/teachingsecondary",
  "teaching secondary (biology)":
    "https://www.mdc.edu/teachingsecondarybiology",
  "teaching secondary biology": "https://www.mdc.edu/teachingsecondarybiology",
  "teaching secondary (chemistry)":
    "https://www.mdc.edu/teachingsecondarychemistry",
  "teaching secondary chemistry":
    "https://www.mdc.edu/teachingsecondarychemistry",
  "teaching secondary (earth/space)":
    "https://www.mdc.edu/teachingsecondaryearthspace",
  "teaching secondary earth space":
    "https://www.mdc.edu/teachingsecondaryearthspace",
  "teaching secondary (english/foreign languages)":
    "https://www.mdc.edu/teachingsecondaryenglish",
  "teaching secondary english": "https://www.mdc.edu/teachingsecondaryenglish",
  "teaching secondary (mathematics education)":
    "https://www.mdc.edu/teachingsecondarymath",
  "teaching secondary mathematics": "https://www.mdc.edu/teachingsecondarymath",
  "teaching secondary (physics)":
    "https://www.mdc.edu/teachingsecondaryphysics",
  "teaching secondary physics": "https://www.mdc.edu/teachingsecondaryphysics",
  "teaching secondary (social science)":
    "https://www.mdc.edu/teachingsecondarysocialscience",
  "teaching secondary social science":
    "https://www.mdc.edu/teachingsecondarysocialscience",
  "teaching secondary (vocational: business, technical, home)":
    "https://www.mdc.edu/teachingsecondaryvocational",
  "teaching secondary vocational":
    "https://www.mdc.edu/teachingsecondaryvocational",
};

// Helper function to get the exact URL for an MDC Associate in Arts program
function getMDCAssociateArtsProgramUrl(programName: string): string | null {
  const normalizedName = programName.toLowerCase().trim();

  // Extract the subject after "Associate in Arts in"
  let subject = normalizedName.replace(/^associate in arts in\s*/, "").trim();

  // Handle engineering programs with specializations
  if (subject.includes("engineering -")) {
    const specialization = subject.split("engineering -")[1]?.trim();
    if (specialization) {
      // Extract first option if multiple are listed
      const firstSpecialization = extractFirstProgramOption(specialization);
      subject = `engineering - ${firstSpecialization}`;
    }
  } else {
    // Extract first option if multiple are listed (e.g., "Art or Art Education")
    subject = extractFirstProgramOption(subject);
  }

  // Try to find an exact or partial match in the mapping
  // But be more strict: don't match if subject contains words that strongly suggest it's an A.S. program
  // (A.S. programs often have "Technology" in the name, which A.A. programs don't)
  const asIndicators = ["technology", "technician"];
  const hasAsIndicator = asIndicators.some((indicator) =>
    subject.includes(indicator)
  );

  for (const [key, url] of Object.entries(MDC_ASSOCIATE_ARTS_URL_MAPPING)) {
    // Exact match always works
    if (subject === key) {
      return url;
    }
    // Partial match only if subject doesn't have A.S. indicators
    if (!hasAsIndicator && (subject.includes(key) || key.includes(subject))) {
      return url;
    }
  }

  return null;
}

// Helper function to check if a program is a valid MDC Associate in Arts (A.A.) program
// A.A. programs follow the pattern: "Associate in Arts in [Subject]" or "Associate in Arts in Engineering - [Specialization]"
function isMDCAssociateInArtsProgram(programName: string): boolean {
  const normalizedName = programName.toLowerCase().trim();

  // Must start with "Associate in Arts"
  if (!normalizedName.startsWith("associate in arts")) {
    return false;
  }

  // Must have a subject after "Associate in Arts in"
  // Valid patterns:
  // - "Associate in Arts in [Subject]"
  // - "Associate in Arts in Engineering - [Specialization]"
  if (normalizedName.includes("associate in arts in")) {
    // Extract the part after "Associate in Arts in"
    const afterPrefix = normalizedName.replace(/^associate in arts in\s*/, "");

    // Must have some content after the prefix
    if (afterPrefix.trim().length === 0) {
      return false;
    }

    // Check if we can find a matching URL (validates it's a real MDC program)
    const url = getMDCAssociateArtsProgramUrl(programName);
    return url !== null;
  }

  return false;
}

// Mapping of MDC Associate in Science (A.S.) programs to their exact URLs
const MDC_ASSOCIATE_SCIENCE_URL_MAPPING: Record<string, string> = {
  "accounting technology": "https://www.mdc.edu/accountingtechnology/",
  "animation & game art": "https://www.mdc.edu/animationgameart/",
  "animation and game art": "https://www.mdc.edu/animationgameart/",
  "applied artificial intelligence": "https://www.mdc.edu/appliedai/",
  "architectural design and construction technology":
    "https://www.mdc.edu/architecturaldesign/",
  "aviation administration": "https://www.mdc.edu/aviationadministration/",
  "aviation maintenance management": "https://www.mdc.edu/aviationmaintenance/",
  "biomedical engineering technology":
    "https://www.mdc.edu/biomedicalengineering",
  biotechnology: "https://www.mdc.edu/biotechnologyas",
  "biotechnology - bioinformatics": "https://www.mdc.edu/bioinformatics",
  "biotechnology - chemical technology":
    "https://www.mdc.edu/biochemicalengineering",
  "building construction technology":
    "https://www.mdc.edu/constructiontechnology/",
  "business administration": "https://www.mdc.edu/businessadministrationas/",
  "business intelligence specialist":
    "https://www.mdc.edu/businessintelligence/",
  "civil engineering technology": "https://www.mdc.edu/civilengineeringas",
  "clinical laboratory science": "https://www.mdc.edu/medicaltechnology/",
  "computer crime investigation":
    "https://www.mdc.edu/computercrimeinvestigation/",
  "computer engineering technology":
    "https://www.mdc.edu/computerengineeringas",
  "computer information technology":
    "https://www.mdc.edu/computerinformationtechnology/",
  "computer programming and analysis - business application programming":
    "https://www.mdc.edu/businessapplications",
  "computer programming and analysis - internet of things (iot) applications":
    "https://www.mdc.edu/internetofthings/",
  "computer programming and analysis - mobile applications development":
    "https://www.mdc.edu/mobileappdeveloper",
  "crime scene technology - crime scene investigation":
    "https://www.mdc.edu/crimescenetechnologycsi/",
  "crime scene technology - forensic science":
    "https://www.mdc.edu/crimescenetechnologyforensic/",
  "criminal justice technology":
    "https://www.mdc.edu/criminaljusticetechnology/",
  "culinary arts management": "https://www.mdc.edu/culinaryartsmanagement/",
  cybersecurity: "https://www.mdc.edu/cybersecurityas",
  "database technology - oracle database administration":
    "https://www.mdc.edu/oracledba",
  "dental hygiene": "https://www.mdc.edu/dentalhygiene/",
  "diagnostic medical sonography": "https://www.mdc.edu/sonography/",
  "early childhood education": "https://www.mdc.edu/earlychildhoodas/",
  "early childhood education - administrators":
    "https://www.mdc.edu/earlychildhoodadministrator/",
  "early childhood education - infant toddler":
    "https://www.mdc.edu/earlychildhoodinfant/",
  "early childhood education - preschool":
    "https://www.mdc.edu/earlychildhoodpreschool/",
  "electronics engineering technology":
    "https://www.mdc.edu/electronicsengineeringtechnology",
  "emergency medical services": "https://www.mdc.edu/ems/",
  entrepreneurship: "https://www.mdc.edu/entrepreneurship/",
  "fashion design": "https://www.mdc.edu/fashiondesign/",
  "fashion merchandising": "https://www.mdc.edu/fashionmerchandising/",
  "film production technology": "https://www.mdc.edu/filmproduction/",
  "financial services - banking": "https://www.mdc.edu/banking/",
  "financial services - wealth management":
    "https://www.mdc.edu/financialmanagement",
  "fire science technology": "https://www.mdc.edu/firescience/",
  "funeral service education": "https://www.mdc.edu/funeralservices/",
  "game development & design": "https://www.mdc.edu/gamedevelopment/",
  "game development and design": "https://www.mdc.edu/gamedevelopment/",
  "graphic design technology": "https://www.mdc.edu/graphicdesign/",
  "graphic internet technology": "https://www.mdc.edu/graphicinternet/",
  "health information technology": "https://www.mdc.edu/healthinformation/",
  "health science - health services management":
    "https://www.mdc.edu/healthservicesas",
  "health sciences": "https://www.mdc.edu/healthsciencesas",
  "histologic technology": "https://www.mdc.edu/histotechnology/",
  "hospitality & tourism management": "https://www.mdc.edu/tourismmanagement/",
  "hospitality and tourism management":
    "https://www.mdc.edu/tourismmanagement/",
  "interior design technology": "https://www.mdc.edu/interiordesigntechnology/",
  "landscape & horticulture technology": "https://www.mdc.edu/landscapeas",
  "landscape and horticulture technology": "https://www.mdc.edu/landscapeas",
  marketing: "https://www.mdc.edu/marketing/",
  "music business - management and marketing":
    "https://www.mdc.edu/musicbusinessmanagement/",
  "music business - performance and production":
    "https://www.mdc.edu/musicbusinessproduction/",
  "networking services technology - enterprise cloud computing":
    "https://www.mdc.edu/cloudcomputing/",
  "networking services technology - network infrastructure":
    "https://www.mdc.edu/networkinfrastructure/",
  "nuclear medicine technology": "https://www.mdc.edu/nuclearmedicine/",
  "nursing - r.n. (accelerated)": "https://www.mdc.edu/nursingrn/",
  "nursing - r.n. (generic full-time)": "https://www.mdc.edu/nursingrn/",
  "nursing - r.n. (generic part-time)": "https://www.mdc.edu/nursingrn/",
  "nursing - r.n. (transitional full-time)": "https://www.mdc.edu/nursingrn/",
  "nursing - r.n. (transitional part-time)": "https://www.mdc.edu/nursingrn/",
  nursing: "https://www.mdc.edu/nursingrn/",
  opticianry: "https://www.mdc.edu/opticianry/",
  "paralegal studies - aba approved": "https://www.mdc.edu/paralegal/",
  "paralegal studies": "https://www.mdc.edu/paralegal/",
  "photographic technology": "https://www.mdc.edu/photography/",
  "physical therapist assistant":
    "https://www.mdc.edu/physicaltherapistassistant/",
  "professional pilot technology": "https://www.mdc.edu/professionalpilot/",
  "radiation therapy": "https://www.mdc.edu/radiation",
  "radio & television broadcast programming": "https://www.mdc.edu/broadcast/",
  "radio and television broadcast programming":
    "https://www.mdc.edu/broadcast/",
  radiography: "https://www.mdc.edu/radiography/",
  "respiratory care": "https://www.mdc.edu/respiratorycare/",
  "respiratory care (accelerated) - crt to rrt":
    "https://www.mdc.edu/respiratorycare/",
  "sign language interpretation": "https://www.mdc.edu/signlanguage/",
  "social and human services - addictions studies":
    "https://www.mdc.edu/addictionstudies/",
  "social and human services - generalist": "https://www.mdc.edu/humanservices",
  "social and human services": "https://www.mdc.edu/humanservices",
  "sport management": "https://www.mdc.edu/sportmanagement",
  "surgical technology": "https://www.mdc.edu/surgicaltechnology/",
  "translation/interpretation studies":
    "https://www.mdc.edu/translationinterpretation/",
  "translation interpretation studies":
    "https://www.mdc.edu/translationinterpretation/",
  "transportation and logistics":
    "https://www.mdc.edu/transportationlogistics/",
  "veterinary technology": "https://www.mdc.edu/veterinarytechnology/",
};

// Helper function to get the exact URL for an MDC Associate in Science program
function getMDCAssociateScienceProgramUrl(programName: string): string | null {
  const normalizedName = programName.toLowerCase().trim();

  // Extract the subject after "Associate in Science in"
  let subject = normalizedName
    .replace(/^associate in science in\s*/, "")
    .trim();

  // Extract first option if multiple are listed
  subject = extractFirstProgramOption(subject);

  // Try to find an exact or partial match in the mapping
  for (const [key, url] of Object.entries(MDC_ASSOCIATE_SCIENCE_URL_MAPPING)) {
    if (subject.includes(key) || key.includes(subject)) {
      return url;
    }
  }

  return null;
}

// Helper function to check if a program is a valid MDC Associate in Science (A.S.) program
function isMDCAssociateInScienceProgram(programName: string): boolean {
  const normalizedName = programName.toLowerCase().trim();

  // Must start with "Associate in Science"
  if (!normalizedName.startsWith("associate in science")) {
    return false;
  }

  // Must have a subject after "Associate in Science in"
  if (normalizedName.includes("associate in science in")) {
    // Extract the part after "Associate in Science in"
    const afterPrefix = normalizedName.replace(
      /^associate in science in\s*/,
      ""
    );

    // Must have some content after the prefix
    if (afterPrefix.trim().length === 0) {
      return false;
    }

    // Check if we can find a matching URL (validates it's a real MDC program)
    const url = getMDCAssociateScienceProgramUrl(programName);
    return url !== null;
  }

  return false;
}

// Mapping of certifications/exams to their official websites and requirements
interface CertificationInfo {
  url: string;
  requirements: string[];
}

const CERTIFICATION_MAPPING: Record<string, CertificationInfo> = {
  // Engineering Exams
  "fundamentals of engineering": {
    url: "https://ncees.org/engineering/fe/",
    requirements: [
      "Bachelor's degree in engineering or related field (or in final year)",
      "Registration with state engineering board",
      "Pass the FE exam (6-hour computer-based exam)",
      "Valid for lifetime once passed",
    ],
  },
  "fe exam": {
    url: "https://ncees.org/engineering/fe/",
    requirements: [
      "Bachelor's degree in engineering or related field (or in final year)",
      "Registration with state engineering board",
      "Pass the FE exam (6-hour computer-based exam)",
      "Valid for lifetime once passed",
    ],
  },
  "principles and practice of engineering": {
    url: "https://ncees.org/engineering/pe/",
    requirements: [
      "Passed the FE exam",
      "Bachelor's degree in engineering from ABET-accredited program",
      "4 years of progressive engineering experience under a PE",
      "Pass the PE exam (8-hour exam in specific discipline)",
      "State-specific additional requirements may apply",
    ],
  },
  "pe exam": {
    url: "https://ncees.org/engineering/pe/",
    requirements: [
      "Passed the FE exam",
      "Bachelor's degree in engineering from ABET-accredited program",
      "4 years of progressive engineering experience under a PE",
      "Pass the PE exam (8-hour exam in specific discipline)",
      "State-specific additional requirements may apply",
    ],
  },
  "professional engineering": {
    url: "https://ncees.org/engineering/pe/",
    requirements: [
      "Passed the FE exam",
      "Bachelor's degree in engineering from ABET-accredited program",
      "4 years of progressive engineering experience under a PE",
      "Pass the PE exam (8-hour exam in specific discipline)",
      "State-specific additional requirements may apply",
    ],
  },

  // Architecture Exams
  "architect registration examination": {
    url: "https://www.ncarb.org/get-licensed/are",
    requirements: [
      "Completed AXP (Architectural Experience Program) - 3,740 hours",
      "Professional degree in architecture (B.Arch or M.Arch)",
      "Pass all 6 divisions of the ARE",
      "Meet state-specific requirements",
    ],
  },
  "a.r.e.": {
    url: "https://www.ncarb.org/get-licensed/are",
    requirements: [
      "Completed AXP (Architectural Experience Program) - 3,740 hours",
      "Professional degree in architecture (B.Arch or M.Arch)",
      "Pass all 6 divisions of the ARE",
      "Meet state-specific requirements",
    ],
  },
  "are exam": {
    url: "https://www.ncarb.org/get-licensed/are",
    requirements: [
      "Completed AXP (Architectural Experience Program) - 3,740 hours",
      "Professional degree in architecture (B.Arch or M.Arch)",
      "Pass all 6 divisions of the ARE",
      "Meet state-specific requirements",
    ],
  },
  "architectural experience program": {
    url: "https://www.ncarb.org/get-licensed/axp",
    requirements: [
      "3,740 hours of diverse professional experience",
      "Experience must be under the supervision of a licensed architect",
      "Documented across 6 experience areas",
      "Can be completed while in school or after graduation",
    ],
  },
  axp: {
    url: "https://www.ncarb.org/get-licensed/axp",
    requirements: [
      "3,740 hours of diverse professional experience",
      "Experience must be under the supervision of a licensed architect",
      "Documented across 6 experience areas",
      "Can be completed while in school or after graduation",
    ],
  },

  // Nursing Exams
  nclex: {
    url: "https://www.ncsbn.org/nclex.htm",
    requirements: [
      "Graduate from an accredited nursing program (ADN or BSN)",
      "Apply for licensure with state board of nursing",
      "Receive Authorization to Test (ATT)",
      "Pass the NCLEX exam (computerized adaptive test)",
      "Meet state-specific requirements",
    ],
  },
  "nclex-rn": {
    url: "https://www.ncsbn.org/nclex.htm",
    requirements: [
      "Graduate from an accredited RN program (ADN or BSN)",
      "Apply for RN licensure with state board of nursing",
      "Receive Authorization to Test (ATT)",
      "Pass the NCLEX-RN exam (up to 265 questions)",
      "Meet state-specific requirements",
    ],
  },
  "nclex-pn": {
    url: "https://www.ncsbn.org/nclex.htm",
    requirements: [
      "Graduate from an accredited practical/vocational nursing program",
      "Apply for PN/LVN licensure with state board of nursing",
      "Receive Authorization to Test (ATT)",
      "Pass the NCLEX-PN exam (up to 205 questions)",
      "Meet state-specific requirements",
    ],
  },
  "national council licensure examination": {
    url: "https://www.ncsbn.org/nclex.htm",
    requirements: [
      "Graduate from an accredited nursing program",
      "Apply for licensure with state board of nursing",
      "Receive Authorization to Test (ATT)",
      "Pass the NCLEX exam",
      "Meet state-specific requirements",
    ],
  },

  // Medical/Healthcare
  usmle: {
    url: "https://www.usmle.org/",
    requirements: [
      "Medical degree (MD) from accredited medical school",
      "Pass Step 1, Step 2 CK, Step 2 CS, and Step 3",
      "Complete clinical rotations",
      "Meet state-specific requirements",
    ],
  },
  "united states medical licensing examination": {
    url: "https://www.usmle.org/",
    requirements: [
      "Medical degree (MD) from accredited medical school",
      "Pass Step 1, Step 2 CK, Step 2 CS, and Step 3",
      "Complete clinical rotations",
      "Meet state-specific requirements",
    ],
  },
  naplex: {
    url: "https://nabp.pharmacy/programs/examinations/naplex/",
    requirements: [
      "Pharmacy degree (PharmD) from accredited program",
      "Complete required pharmacy internships",
      "Pass the NAPLEX exam (250 questions)",
      "Pass state-specific MPJE exam",
      "Meet state-specific requirements",
    ],
  },
  "north american pharmacist licensure examination": {
    url: "https://nabp.pharmacy/programs/examinations/naplex/",
    requirements: [
      "Pharmacy degree (PharmD) from accredited program",
      "Complete required pharmacy internships",
      "Pass the NAPLEX exam (250 questions)",
      "Pass state-specific MPJE exam",
      "Meet state-specific requirements",
    ],
  },
  "dental hygiene national board": {
    url: "https://www.ada.org/en/education-careers/dental-hygiene-national-board-examination",
    requirements: [
      "Graduate from accredited dental hygiene program",
      "Pass the National Board Dental Hygiene Examination (NBDHE)",
      "Pass state-specific clinical and written exams",
      "Meet state-specific requirements",
    ],
  },
  "dental hygiene exam": {
    url: "https://www.ada.org/en/education-careers/dental-hygiene-national-board-examination",
    requirements: [
      "Graduate from accredited dental hygiene program",
      "Pass the National Board Dental Hygiene Examination (NBDHE)",
      "Pass state-specific clinical and written exams",
      "Meet state-specific requirements",
    ],
  },
  ardms: {
    url: "https://www.ardms.org/",
    requirements: [
      "Graduate from accredited diagnostic medical sonography program",
      "Complete clinical experience requirements",
      "Pass ARDMS certification exam in specialty area",
      "Maintain continuing education credits",
    ],
  },
  "american registry for diagnostic medical sonography": {
    url: "https://www.ardms.org/",
    requirements: [
      "Graduate from accredited diagnostic medical sonography program",
      "Complete clinical experience requirements",
      "Pass ARDMS certification exam in specialty area",
      "Maintain continuing education credits",
    ],
  },
  arrt: {
    url: "https://www.arrt.org/",
    requirements: [
      "Graduate from accredited radiologic technology program",
      "Complete clinical experience requirements",
      "Pass ARRT certification exam",
      "Meet ethics requirements",
      "Maintain continuing education credits",
    ],
  },
  "american registry of radiologic technologists": {
    url: "https://www.arrt.org/",
    requirements: [
      "Graduate from accredited radiologic technology program",
      "Complete clinical experience requirements",
      "Pass ARRT certification exam",
      "Meet ethics requirements",
      "Maintain continuing education credits",
    ],
  },
  nbrc: {
    url: "https://www.nbrc.org/",
    requirements: [
      "Graduate from accredited respiratory care program",
      "Pass CRT (Certified Respiratory Therapist) exam",
      "For RRT: Pass additional advanced level exams",
      "Maintain continuing education credits",
    ],
  },
  "national board for respiratory care": {
    url: "https://www.nbrc.org/",
    requirements: [
      "Graduate from accredited respiratory care program",
      "Pass CRT (Certified Respiratory Therapist) exam",
      "For RRT: Pass additional advanced level exams",
      "Maintain continuing education credits",
    ],
  },
  crt: {
    url: "https://www.nbrc.org/",
    requirements: [
      "Graduate from accredited respiratory care program",
      "Pass CRT (Certified Respiratory Therapist) exam",
      "Maintain continuing education credits",
    ],
  },
  rrt: {
    url: "https://www.nbrc.org/",
    requirements: [
      "Hold CRT certification",
      "Pass RRT (Registered Respiratory Therapist) written exam",
      "Pass RRT clinical simulation exam",
      "Maintain continuing education credits",
    ],
  },
  npte: {
    url: "https://www.fsbpt.org/",
    requirements: [
      "Graduate from accredited physical therapy program (DPT)",
      "Complete required clinical hours",
      "Pass the NPTE (National Physical Therapy Examination)",
      "Meet state-specific requirements",
      "Pass state jurisprudence exam (if required)",
    ],
  },
  "national physical therapy examination": {
    url: "https://www.fsbpt.org/",
    requirements: [
      "Graduate from accredited physical therapy program (DPT)",
      "Complete required clinical hours",
      "Pass the NPTE (National Physical Therapy Examination)",
      "Meet state-specific requirements",
      "Pass state jurisprudence exam (if required)",
    ],
  },

  // Legal
  "bar exam": {
    url: "https://www.ncbex.org/",
    requirements: [
      "Juris Doctor (JD) degree from accredited law school",
      "Pass the Multistate Bar Examination (MBE)",
      "Pass state-specific bar exam components",
      "Pass Multistate Professional Responsibility Examination (MPRE)",
      "Meet state-specific character and fitness requirements",
    ],
  },
  "florida bar": {
    url: "https://www.floridabar.org/",
    requirements: [
      "Juris Doctor (JD) degree from accredited law school",
      "Pass the Florida Bar Examination",
      "Pass the Multistate Professional Responsibility Examination (MPRE)",
      "Complete Florida Law Component",
      "Meet character and fitness requirements",
    ],
  },

  // IT/Cybersecurity
  "comptia a+": {
    url: "https://www.comptia.org/certifications/a",
    requirements: [
      "No formal prerequisites required",
      "Recommended: 9-12 months hands-on experience",
      "Pass two exams: Core 1 and Core 2",
      "Renew every 3 years through continuing education",
    ],
  },
  "a+": {
    url: "https://www.comptia.org/certifications/a",
    requirements: [
      "No formal prerequisites required",
      "Recommended: 9-12 months hands-on experience",
      "Pass two exams: Core 1 and Core 2",
      "Renew every 3 years through continuing education",
    ],
  },
  "security+": {
    url: "https://www.comptia.org/certifications/security",
    requirements: [
      "Recommended: Network+ and 2 years IT security experience",
      "Pass one exam covering security concepts",
      "Renew every 3 years through continuing education",
    ],
  },
  cissp: {
    url: "https://www.isc2.org/certifications/cissp",
    requirements: [
      "5 years of cumulative paid work experience in 2+ domains",
      "OR 4 years with a college degree or approved credential",
      "Pass the CISSP exam (250 questions, 6 hours)",
      "Endorsement from another CISSP",
      "Maintain continuing education credits",
    ],
  },
  "certified information systems security professional": {
    url: "https://www.isc2.org/certifications/cissp",
    requirements: [
      "5 years of cumulative paid work experience in 2+ domains",
      "OR 4 years with a college degree or approved credential",
      "Pass the CISSP exam (250 questions, 6 hours)",
      "Endorsement from another CISSP",
      "Maintain continuing education credits",
    ],
  },
  pmp: {
    url: "https://www.pmi.org/certifications/project-management-pmp",
    requirements: [
      "4-year degree + 36 months leading projects + 35 hours project management education",
      "OR High school diploma + 60 months leading projects + 35 hours project management education",
      "Pass the PMP exam (180 questions, 230 minutes)",
      "Maintain continuing education credits (60 PDUs every 3 years)",
    ],
  },
  "project management professional": {
    url: "https://www.pmi.org/certifications/project-management-pmp",
    requirements: [
      "4-year degree + 36 months leading projects + 35 hours project management education",
      "OR High school diploma + 60 months leading projects + 35 hours project management education",
      "Pass the PMP exam (180 questions, 230 minutes)",
      "Maintain continuing education credits (60 PDUs every 3 years)",
    ],
  },

  // Teaching
  ftce: {
    url: "https://www.fl.nesinc.com/",
    requirements: [
      "Bachelor's degree from accredited institution",
      "Complete approved teacher preparation program",
      "Pass Florida Teacher Certification Examinations (FTCE)",
      "Pass subject area exam for certification field",
      "Pass General Knowledge Test",
      "Pass Professional Education Test",
    ],
  },
  "florida teacher certification examinations": {
    url: "https://www.fl.nesinc.com/",
    requirements: [
      "Bachelor's degree from accredited institution",
      "Complete approved teacher preparation program",
      "Pass Florida Teacher Certification Examinations (FTCE)",
      "Pass subject area exam for certification field",
      "Pass General Knowledge Test",
      "Pass Professional Education Test",
    ],
  },

  // Aviation
  atp: {
    url: "https://www.faa.gov/licenses_certificates/airmen_certification/airline_transport_pilot/",
    requirements: [
      "Be at least 23 years old",
      "Hold Commercial Pilot Certificate",
      "1,500 hours total flight time",
      "500 hours cross-country flight time",
      "100 hours night flight time",
      "75 hours instrument time",
      "Pass written, oral, and flight tests",
    ],
  },
  "airline transport pilot": {
    url: "https://www.faa.gov/licenses_certificates/airmen_certification/airline_transport_pilot/",
    requirements: [
      "Be at least 23 years old",
      "Hold Commercial Pilot Certificate",
      "1,500 hours total flight time",
      "500 hours cross-country flight time",
      "100 hours night flight time",
      "75 hours instrument time",
      "Pass written, oral, and flight tests",
    ],
  },

  // Other Professional
  cpa: {
    url: "https://www.aicpa-cima.com/cpa-exam",
    requirements: [
      "Bachelor's degree (150 semester hours total)",
      "Complete accounting coursework requirements",
      "Pass all 4 sections of the Uniform CPA Examination",
      "Complete ethics exam (state-specific)",
      "Meet state-specific experience requirements",
      "Meet state-specific residency requirements",
    ],
  },
  "certified public accountant": {
    url: "https://www.aicpa-cima.com/cpa-exam",
    requirements: [
      "Bachelor's degree (150 semester hours total)",
      "Complete accounting coursework requirements",
      "Pass all 4 sections of the Uniform CPA Examination",
      "Complete ethics exam (state-specific)",
      "Meet state-specific experience requirements",
      "Meet state-specific residency requirements",
    ],
  },
};

// Florida (In-State) University Transfer Recommendations
interface UniversityInfo {
  name: string;
  website: string;
  location: string;
  type: string; // "Public" or "Private"
  notes?: string;
}

const FLORIDA_UNIVERSITIES: UniversityInfo[] = [
  {
    name: "University of Florida (UF)",
    website: "https://www.ufl.edu/",
    location: "Gainesville",
    type: "Public",
    notes: "Flagship state university, strong articulation agreements with MDC",
  },
  {
    name: "Florida State University (FSU)",
    website: "https://www.fsu.edu/",
    location: "Tallahassee",
    type: "Public",
    notes: "Major research university, excellent transfer pathways",
  },
  {
    name: "University of South Florida (USF)",
    website: "https://www.usf.edu/",
    location: "Tampa",
    type: "Public",
    notes: "Multiple campuses, strong engineering and business programs",
  },
  {
    name: "Florida International University (FIU)",
    website: "https://www.fiu.edu/",
    location: "Miami",
    type: "Public",
    notes: "Local option in Miami, strong transfer agreements with MDC",
  },
  {
    name: "University of Central Florida (UCF)",
    website: "https://www.ucf.edu/",
    location: "Orlando",
    type: "Public",
    notes:
      "Largest university in Florida, excellent engineering and hospitality programs",
  },
  {
    name: "Florida Atlantic University (FAU)",
    website: "https://www.fau.edu/",
    location: "Boca Raton",
    type: "Public",
    notes:
      "Multiple campuses in South Florida, strong business and engineering programs",
  },
  {
    name: "Florida A&M University (FAMU)",
    website: "https://www.famu.edu/",
    location: "Tallahassee",
    type: "Public",
    notes:
      "Historically Black University, strong programs in pharmacy and engineering",
  },
  {
    name: "University of North Florida (UNF)",
    website: "https://www.unf.edu/",
    location: "Jacksonville",
    type: "Public",
    notes: "Strong business and health sciences programs",
  },
  {
    name: "Florida Gulf Coast University (FGCU)",
    website: "https://www.fgcu.edu/",
    location: "Fort Myers",
    type: "Public",
    notes: "Growing university with strong environmental and business programs",
  },
  {
    name: "University of West Florida (UWF)",
    website: "https://uwf.edu/",
    location: "Pensacola",
    type: "Public",
    notes: "Strong programs in business, education, and health sciences",
  },
  {
    name: "New College of Florida",
    website: "https://www.ncf.edu/",
    location: "Sarasota",
    type: "Public",
    notes: "Small liberal arts honors college, unique academic structure",
  },
  {
    name: "Florida Polytechnic University",
    website: "https://www.floridapoly.edu/",
    location: "Lakeland",
    type: "Public",
    notes:
      "STEM-focused university, strong engineering and technology programs",
  },
  {
    name: "University of Miami",
    website: "https://welcome.miami.edu/",
    location: "Coral Gables",
    type: "Private",
    notes: "Private research university, strong programs across disciplines",
  },
  {
    name: "Nova Southeastern University (NSU)",
    website: "https://www.nova.edu/",
    location: "Fort Lauderdale",
    type: "Private",
    notes: "Private university with strong health sciences and law programs",
  },
  {
    name: "Florida Institute of Technology (FIT)",
    website: "https://www.fit.edu/",
    location: "Melbourne",
    type: "Private",
    notes:
      "STEM-focused private university, strong engineering and aviation programs",
  },
  {
    name: "Rollins College",
    website: "https://www.rollins.edu/",
    location: "Winter Park",
    type: "Private",
    notes: "Private liberal arts college, strong business and arts programs",
  },
  {
    name: "Stetson University",
    website: "https://www.stetson.edu/",
    location: "DeLand",
    type: "Private",
    notes: "Private university, strong programs in business, law, and music",
  },
  {
    name: "Barry University",
    website: "https://www.barry.edu/",
    location: "Miami Shores",
    type: "Private",
    notes:
      "Private Catholic university, strong health sciences and education programs",
  },
  {
    name: "St. Thomas University",
    website: "https://www.stu.edu/",
    location: "Miami Gardens",
    type: "Private",
    notes: "Private Catholic university, strong business and law programs",
  },
  {
    name: "Lynn University",
    website: "https://www.lynn.edu/",
    location: "Boca Raton",
    type: "Private",
    notes: "Private university, strong hospitality and business programs",
  },
];

// Helper function to get certification/exam info (URL and requirements)
function getCertificationInfo(examName: string): CertificationInfo | null {
  const normalizedName = examName.toLowerCase().trim();

  // Try to find a match in the mapping
  for (const [key, info] of Object.entries(CERTIFICATION_MAPPING)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return info;
    }
  }

  return null;
}

// Helper function to parse requirements from description or generate meaningful requirements
function parseRequirementsFromDescription(description: string | undefined, examName: string): string[] {
  if (!description) {
    return generateGenericRequirements(examName);
  }

  // Try to extract requirements from description
  const desc = description.toLowerCase();
  
  // Check if description contains "requirements:" or similar indicators
  if (desc.includes("requirements:") || desc.includes("requirements include") || desc.includes("must")) {
    // Try to split by common separators
    const requirements: string[] = [];
    const parts = description.split(/[;•\n-]/).map(p => p.trim()).filter(p => p.length > 0);
    
    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      // Look for requirement-like phrases
      if (lowerPart.includes("bachelor") || lowerPart.includes("degree") || 
          lowerPart.includes("pass") || lowerPart.includes("exam") ||
          lowerPart.includes("apply") || lowerPart.includes("licensure") ||
          lowerPart.includes("experience") || lowerPart.includes("hours") ||
          lowerPart.includes("accredited") || lowerPart.includes("state")) {
        requirements.push(part);
      }
    }
    
    if (requirements.length > 0) {
      return requirements;
    }
  }
  
  // If description doesn't contain structured requirements, generate based on exam type
  return generateGenericRequirements(examName);
}

// Helper function to generate generic requirements based on exam name
function generateGenericRequirements(examName: string): string[] {
  const name = examName.toLowerCase();
  const requirements: string[] = [];
  
  // Engineering exams
  if (name.includes("fe") || name.includes("fundamentals of engineering")) {
    requirements.push("Bachelor's degree in engineering or related field (or in final year)");
    requirements.push("Registration with state engineering board");
    requirements.push("Pass the FE exam (6-hour computer-based exam)");
  } else if (name.includes("pe") || name.includes("professional engineering") || name.includes("principles and practice")) {
    requirements.push("Passed the FE exam");
    requirements.push("Bachelor's degree in engineering from ABET-accredited program");
    requirements.push("4 years of progressive engineering experience under a PE");
    requirements.push("Pass the PE exam (8-hour exam in specific discipline)");
  }
  // Nursing exams
  else if (name.includes("nclex")) {
    requirements.push("Graduate from an accredited nursing program (ADN or BSN)");
    requirements.push("Apply for licensure with state board of nursing");
    requirements.push("Receive Authorization to Test (ATT)");
    requirements.push("Pass the NCLEX exam");
  }
  // Architecture exams
  else if (name.includes("are") || name.includes("architect registration")) {
    requirements.push("Complete accredited architecture degree (B.Arch or M.Arch)");
    requirements.push("Complete Architectural Experience Program (AXP) - 3,740 hours");
    requirements.push("Pass all 6 divisions of the A.R.E.");
  }
  // CPA exams
  else if (name.includes("cpa") || name.includes("certified public accountant")) {
    requirements.push("Bachelor's degree (150 semester hours total)");
    requirements.push("Complete accounting coursework requirements");
    requirements.push("Pass all 4 sections of the Uniform CPA Examination");
    requirements.push("Meet state-specific experience requirements");
  }
  // Medical exams
  else if (name.includes("usmle") || name.includes("medical licensing")) {
    requirements.push("Medical degree (MD) from accredited medical school");
    requirements.push("Pass Step 1, Step 2 CK, Step 2 CS, and Step 3");
    requirements.push("Complete clinical rotations");
  }
  // Generic fallback
  else {
    requirements.push("Check the official certification website for specific education prerequisites");
    requirements.push("Complete required coursework or training program");
    requirements.push("Apply for examination with the certifying organization");
    requirements.push("Pass the required examination(s)");
    requirements.push("Meet state-specific or jurisdiction-specific requirements");
    requirements.push("Complete any required professional experience or internships");
  }
  
  return requirements;
}

// Helper function to convert program name to MDC URL slug
function getMDCProgramUrl(programName: string): string {
  // Extract the first program option if multiple are listed
  // This allows the title to show all options, but the link goes to one specific program
  const singleProgram = extractFirstProgramOption(programName);

  // Check if it's a bachelor's program first - use exact URL mapping
  const bachelorsUrl = getMDCBachelorsProgramUrl(singleProgram);
  if (bachelorsUrl) {
    return bachelorsUrl;
  }

  // Check if it's an Associate in Science program FIRST (before A.A.) - use exact URL mapping
  // This ensures A.S. programs don't get matched to A.A. programs
  const associateScienceUrl = getMDCAssociateScienceProgramUrl(singleProgram);
  if (associateScienceUrl) {
    return associateScienceUrl;
  }

  // Check if it's an Associate in Arts program - use exact URL mapping
  const associateArtsUrl = getMDCAssociateArtsProgramUrl(singleProgram);
  if (associateArtsUrl) {
    return associateArtsUrl;
  }

  // For other programs (Certificates), try to generate URL from name

  // Remove common prefixes
  let slug = singleProgram
    .replace(/^Associate in Arts in /i, "")
    .replace(/^Associate in Science in /i, "")
    .replace(/^Associate in /i, "")
    .replace(/^Bachelor of Science in /i, "")
    .replace(/^Bachelor of Arts in /i, "")
    .replace(/^Bachelor of Applied Sciences in /i, "")
    .replace(/^Bachelor of Applied Science in /i, "")
    .replace(/^Bachelor of /i, "")
    .replace(/^Certificate in /i, "")
    .replace(/^Certificate /i, "")
    .trim();

  // Handle special cases for engineering programs
  // Extract the engineering specialization (e.g., "Engineering - Mechanical" -> "Mechanical Engineering")
  if (slug.includes("Engineering - ")) {
    const specialization = slug.split("Engineering - ")[1]?.trim();
    if (specialization) {
      // Handle cases like "Mechanical or Civil" - take the first one
      const firstSpecialization = extractFirstProgramOption(specialization);
      slug = `${firstSpecialization} Engineering`;
    }
  }

  // Convert to URL-friendly format: lowercase, remove spaces and special characters
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "") // Remove all spaces
    .replace(/-/g, ""); // Remove hyphens

  // Return the MDC program URL
  return `https://www.mdc.edu/${slug}/`;
}

// Global cache for exam info (shared across all instances)
const examInfoGlobalCache: Record<string, CertificationInfo> = {};

// Component for exam steps that fetches info dynamically
function ExamStepComponent({ 
  examName, 
  examDescription, 
  careerIndex,
  onShowRequirements 
}: { 
  examName: string; 
  examDescription?: string; 
  careerIndex?: number;
  onShowRequirements: (name: string, info: CertificationInfo, careerIndex?: number) => void;
}) {
  const [examInfo, setExamInfo] = useState<CertificationInfo | null>(null);
  const [loadingExamInfo, setLoadingExamInfo] = useState(false);

  const fetchExamInfo = async () => {
    const cacheKey = examName.toLowerCase();
    
    // Check global cache first
    if (examInfoGlobalCache[cacheKey]) {
      setExamInfo(examInfoGlobalCache[cacheKey]);
      return;
    }

    setLoadingExamInfo(true);
    try {
      const response = await fetch("/api/get-exam-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ examName }),
      });

      const data = await response.json();
      
      if (response.ok && !data.error) {
        setExamInfo(data);
        // Cache the result globally
        examInfoGlobalCache[cacheKey] = data;
      } else {
        // Fallback to search URL and generic requirements
        const fallbackInfo: CertificationInfo = {
          url: data.url || `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`,
          requirements: data.requirements || parseRequirementsFromDescription(examDescription, examName)
        };
        setExamInfo(fallbackInfo);
        examInfoGlobalCache[cacheKey] = fallbackInfo;
      }
    } catch (error) {
      console.error("Error fetching exam info:", error);
      // Fallback
      const fallbackInfo: CertificationInfo = {
        url: `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`,
        requirements: parseRequirementsFromDescription(examDescription, examName)
      };
      setExamInfo(fallbackInfo);
      examInfoGlobalCache[cacheKey] = fallbackInfo;
    } finally {
      setLoadingExamInfo(false);
    }
  };

  const handleRequirementsClick = async () => {
    const cacheKey = examName.toLowerCase();
    let infoToShow = examInfo || examInfoGlobalCache[cacheKey];
    
    if (!infoToShow) {
      // Fetch if not available
      await fetchExamInfo();
      infoToShow = examInfo || examInfoGlobalCache[cacheKey] || {
        url: `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`,
        requirements: parseRequirementsFromDescription(examDescription, examName)
      };
    }

    onShowRequirements(examName, infoToShow, careerIndex);
  };

  // Pre-fetch exam info when component mounts
  useEffect(() => {
    fetchExamInfo();
  }, [examName]);

  const examUrl = examInfo?.url || examInfoGlobalCache[examName.toLowerCase()]?.url || `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`;

  return (
    <div className="mt-4 space-y-2">
      <button
        onClick={handleRequirementsClick}
        disabled={loadingExamInfo}
        className="w-full text-left text-sm font-semibold text-purple-700 hover:text-purple-800 focus:outline-none focus:underline flex items-center disabled:opacity-50"
      >
        <i className="fas fa-info-circle mr-2" />
        {loadingExamInfo ? "Loading Requirements..." : "Requirements"}
      </button>
      <a
        href={examUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150"
      >
        <i className="fas fa-external-link-alt mr-2" />{" "}
        View Certification Website
      </a>
    </div>
  );
}

const SUGGESTIONS = [
  "project manager",
  "parent",
  "software engineer",
  "rideshare driver",
  "MOS 09L",
  "retail clerk"
];

export default function PathwayPage() {
  const [careerInput, setCareerInput] = useState("");
  const [showClearBtn, setShowClearBtn] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);
  const [displayedText, setDisplayedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("MDC Details");
  const [modalContent, setModalContent] = useState<string>("");
  const [pathwayData, setPathwayData] = useState<PathwayData | null>(null);
  const [comparisonPathways, setComparisonPathways] = useState<CareerPathway[]>([]);
  const [showAddCareerInput, setShowAddCareerInput] = useState<boolean>(false);
  const [addCareerInput, setAddCareerInput] = useState<string>("");
  const [certificationPopup, setCertificationPopup] = useState<{
    name: string;
    info: CertificationInfo;
    careerIndex?: number;
  } | null>(null);
  const [transferRecommendationsPopup, setTransferRecommendationsPopup] =
    useState<boolean>(false);
  const [selectedPathwayIndex, setSelectedPathwayIndex] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setShowClearBtn(careerInput.length > 0);
    
    // Filter suggestions based on input
    if (careerInput.length > 0) {
      const filtered = SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(careerInput.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && careerInput !== filtered[0]);
    } else {
      setFilteredSuggestions(SUGGESTIONS);
      setShowSuggestions(true);
    }
  }, [careerInput]);

  // Typewriter effect for instruction text
  useEffect(() => {
    const fullText = " To start, share a current or previous role:";
    setDisplayedText("");
    
    // Start typing after wave animation (1 second)
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 50); // Speed of typing (50ms per letter)

      return () => clearInterval(typingInterval);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Cycle through suggestions in placeholder with smooth fade
  useEffect(() => {
    if (careerInput.length === 0) {
      const interval = setInterval(() => {
        // Fade out
        setPlaceholderOpacity(0);
        
        // After fade out, change suggestion and fade in
        setTimeout(() => {
          setCurrentSuggestionIndex((prevIndex) => (prevIndex + 1) % SUGGESTIONS.length);
          setPlaceholderOpacity(1);
        }, 300); // Half of transition time
      }, 1000); // Change every 1 second

      return () => clearInterval(interval);
    } else {
      setPlaceholderOpacity(1);
    }
  }, [careerInput]);

  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [modalOpen]);

  const showLoading = (message: string) => {
    setLoadingMessage(message || "Loading...");
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  const showModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  const hideModal = () => {
    setModalOpen(false);
  };

  const callAPI = async (career: string, retries = 3, delay = 1000) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch("/api/generate-pathway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ career }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();
        return result;
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted by user.");
          throw error;
        }
        console.error(`API call attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          throw error;
        }
        await new Promise((res) => setTimeout(res, delay * Math.pow(2, i)));
      } finally {
        if (i === retries - 1) {
          abortControllerRef.current = null;
        }
      }
    }
  };

  const handleGeneratePathway = async () => {
    const career = careerInput.trim();
    if (!career) {
      showModal(
        "Error",
        '<p class="text-red-600">Please enter a career title.</p>'
      );
      return;
    }

    showLoading(`Generating pathway for ${career}...`);

    try {
      const generatedData = await callAPI(career);

      // Handle backward compatibility: if old format (with "steps"), convert to new format
      let pathwayDataToSet: PathwayData;
      if ("steps" in generatedData && !("pathways" in generatedData)) {
        // Old format - convert to new format
        pathwayDataToSet = {
          title: generatedData.title,
          pathways: [
            {
              title: generatedData.title,
              isPrimary: true,
              steps: generatedData.steps,
            },
          ],
        };
      } else {
        // New format
        pathwayDataToSet = generatedData as PathwayData;
      }
      
      // First/main pathway (always set when using main search)
      setPathwayData(pathwayDataToSet);
      // Set selected pathway to primary (or first if no primary)
      if (pathwayDataToSet.pathways && pathwayDataToSet.pathways.length > 0) {
        const primaryIndex = pathwayDataToSet.pathways.findIndex(
          (p: PathwayOption) => p.isPrimary
        );
        setSelectedPathwayIndex(primaryIndex >= 0 ? primaryIndex : 0);
      }
      // Clear any previous comparisons when starting a new main search
      setComparisonPathways([]);
      setShowAddCareerInput(false);
      setAddCareerInput("");
      setCertificationPopup(null); // Close popup when new pathway is generated
      setTransferRecommendationsPopup(false); // Close transfer popup when new pathway is generated
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error generating custom pathway:", error);
        showModal(
          "Generation Failed",
          `<p class="text-red-600">Sorry, I couldn't generate a pathway for that career. Please try a different prompt.<br><br><small>Error: ${error.message}</small></p>`
        );
      }
    } finally {
      hideLoading();
    }
  };

  const handleCancelLoad = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Fetch request cancelled.");
    }
    hideLoading();
  };

  const handleHelp = () => {
    showModal(
      "How to use MyMDC Pathway?",
      `
      <div class="space-y-4 text-gray-700">
        <p><strong>Generate a Pathway:</strong></p>
        <p>1. Type your desired career (e.g., "Software Engineer" or "Nurse") into the text box.</p>
        <p>2. Press <kbd class="px-2 py-1 bg-gray-200 rounded-md text-sm">Enter</kbd> or click the blue arrow button to generate a personalized educational pathway.</p>
        <p>3. The pathway will show you recommended degrees from MDC, potential transfer steps to universities, and other milestones like internships and exams.</p>
        <p class="mt-4"><strong>Compare Careers:</strong></p>
        <p>1. After generating a pathway, click the "+ Compare Another Career" button below the flowchart.</p>
        <p>2. Enter another career (e.g., "Electrical Engineer") in the search bar that appears.</p>
        <p>3. The new pathway will appear below the first one, allowing you to compare them side by side.</p>
        <p>4. You can add up to 4 careers total (1 main + 3 additional).</p>
        <p>5. Click the X button on any additional career to remove it from comparison.</p>
      </div>
    `
    );
  };

  const handleClearInput = () => {
    setCareerInput("");
    setShowClearBtn(false);
  };

  const handleClearPathway = () => {
    setPathwayData(null);
    // Don't clear comparison pathways - only clear the main pathway
    setShowAddCareerInput(false);
    setAddCareerInput("");
    setCertificationPopup(null); // Close popup when pathway is cleared
    setTransferRecommendationsPopup(false); // Close transfer popup when pathway is cleared
  };

  const handleRemoveFromComparison = (index: number) => {
    setComparisonPathways(comparisonPathways.filter((_, i) => i !== index));
  };

  const handlePathwaySelectInComparison = (careerIndex: number, pathwayIndex: number) => {
    const updated = [...comparisonPathways];
    updated[careerIndex].selectedPathwayIndex = pathwayIndex;
    setComparisonPathways(updated);
  };

  const handleAddCareerClick = () => {
    setShowAddCareerInput(true);
  };

  const handleAddCareerGenerate = async () => {
    if (!addCareerInput.trim()) {
      return;
    }
    const career = addCareerInput.trim();
    await handleGeneratePathwayForCareer(career);
  };

  const handleGeneratePathwayForCareer = async (career: string) => {
    showLoading(`Generating pathway for ${career}...`);
    try {
      const generatedData = await callAPI(career);
      
      let pathwayDataToSet: PathwayData;
      
      // Handle backward compatibility
      if ((generatedData as any).steps) {
        // Old format - convert to new format
        pathwayDataToSet = {
          title: (generatedData as any).title || `Pathway to becoming a ${career}`,
          pathways: [
            {
              title: "Primary Pathway",
              isPrimary: true,
              steps: (generatedData as any).steps,
            },
          ],
        };
      } else {
        // New format
        pathwayDataToSet = generatedData as PathwayData;
      }
      
      // Adding a career to comparison
      const primaryIndex = pathwayDataToSet.pathways.findIndex(
        (p: PathwayOption) => p.isPrimary
      );
      const selectedIndex = primaryIndex >= 0 ? primaryIndex : 0;
      
      if (comparisonPathways.length < 3) { // Max 4 total (1 main + 3 additional)
        setComparisonPathways([
          ...comparisonPathways,
          {
            career: career,
            data: pathwayDataToSet,
            selectedPathwayIndex: selectedIndex,
          },
        ]);
        setAddCareerInput(""); // Clear input
        setShowAddCareerInput(false); // Hide input
      } else {
        showModal(
          "Maximum Reached",
          '<p class="text-red-600">You can compare up to 4 careers at a time. Please remove one before adding another.</p>'
        );
      }
      
      setCertificationPopup(null);
      setTransferRecommendationsPopup(false);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error generating pathway:", error);
        showModal(
          "Generation Failed",
          `<p class="text-red-600">Failed to generate pathway. Please try again.</p>`
        );
      }
    } finally {
      hideLoading();
    }
  };

  const handleAddCareerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCareerGenerate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGeneratePathway();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar - Centered Logo */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Link href="/">
            <img
              src="https://mdcwap.mdc.edu/apply/assets/mdc-logo.png"
              alt="Miami Dade College Logo"
              className="h-10 w-auto cursor-pointer"
            />
          </Link>
        </div>
      </header>

      {/* Search Section */}
      <section className="px-6 md:px-8 pt-24 md:pt-32 pb-24 md:pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Instruction Text */}
          <p className="text-gray-700 mb-6 text-left text-xl md:text-3xl">
            <span className="wave-emoji">👋</span>
            <span>{displayedText}</span>
            {displayedText.length > 0 && displayedText.length < " To start, share a current or previous role:".length && (
              <span className="inline-block w-0.5 h-5 bg-gray-700 ml-1 animate-blink">|</span>
            )}
          </p>

          {/* Search Bar */}
          <div className="mb-6 relative fade-in-delay-2">
            <div className="input-container w-full relative">
              <input
                type="text"
                id="custom-career-input"
                value={careerInput}
                onChange={(e) => setCareerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={careerInput.length === 0 ? SUGGESTIONS[currentSuggestionIndex] : "project manager"}
                className={`w-full py-2 min-h-[60px] bg-transparent border-none outline-none focus:outline-none text-[20px] md:text-[55px] leading-[1.1] text-gray-900 placeholder:text-gray-300 placeholder-transition ${
                  placeholderOpacity === 0 ? 'placeholder-opacity-0' : 'placeholder-opacity-50'
                }`}
                autoFocus
              />
              {showClearBtn && (
                <span
                  id="clear-input-btn"
                  onClick={handleClearInput}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                  title="Clear input"
                >
                  <i className="fas fa-times-circle"></i>
                </span>
              )}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleGeneratePathway}
            disabled={!careerInput.trim()}
            className={`px-16 py-4 rounded-lg shadow-md transition duration-200 text-base fade-in-delay-2 ${
              careerInput.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer'
                : 'bg-blue-200 text-white font-semibold cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      </section>

      {/* Infographic Display Area - Shows right after search when pathway exists */}
      <div id="pathway-display" className="p-6 md:p-8">
        {/* Main Pathway */}
        {pathwayData && pathwayData.pathways && pathwayData.pathways.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {pathwayData.title.replace(/^(Educational\s+)?Pathway\s+to\s+becoming\s+(a\s+|an\s+)?/i, '')}
              </h2>
              <button
                onClick={handleClearPathway}
                className="text-gray-400 hover:text-gray-600"
                title="Clear Pathway"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </div>

            {/* Pathway Tabs */}
            {pathwayData.pathways.length > 1 && (
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-1 overflow-x-auto" aria-label="Pathway Tabs">
                  {pathwayData.pathways.map((pathway, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPathwayIndex(index)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        selectedPathwayIndex === index
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {pathway.isPrimary && (
                        <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                      {pathway.title}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Selected Pathway Display */}
            <div className="flowchart-container">
              {pathwayData.pathways[selectedPathwayIndex].steps.map(
                (step, stepIndex) => {
                  const stepTypeClass = `flowchart-step-${step.type}`;
                  const IconComponent = icons[step.type];

                  return (
                    <div key={stepIndex}>
                      {stepIndex > 0 && <div className="flowchart-connector" />}
                      <div className={`flowchart-step ${stepTypeClass}`}>
                        <div className="flowchart-step-header">
                          <div className="flowchart-step-header-icon">
                            {IconComponent}
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {step.level || step.type}
                          </span>
                        </div>
                        <div className="flowchart-step-content">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {step.name}
                          </h3>
                          <p className="text-gray-600 mt-2">{step.description}</p>
                          {step.type === "transfer" && (
                            <div className="mt-4 space-y-2">
                              <button
                                onClick={() => setTransferRecommendationsPopup(true)}
                                className="w-full text-left text-sm font-semibold text-orange-700 hover:text-orange-800 focus:outline-none focus:underline flex items-center"
                              >
                                <i className="fas fa-info-circle mr-2" />
                                Recommendations
                              </button>
                              <a
                                href="https://www.mdc.edu/transfer-information/transfer-agreements/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150"
                              >
                                <i className="fas fa-external-link-alt mr-2" /> View
                                Transfer Agreements
                              </a>
                            </div>
                          )}
                          {step.type === "degree" &&
                            ((step.level.includes("MDC") &&
                              !step.name.toLowerCase().includes("bachelor") &&
                              (isMDCAssociateInScienceProgram(step.name) ||
                                isMDCAssociateInArtsProgram(step.name))) ||
                              step.name.toLowerCase().includes("certificate") ||
                              (step.name.toLowerCase().includes("bachelor") &&
                                isMDCBachelorsProgram(step.name))) && (
                              <a
                                href={getMDCProgramUrl(step.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                              >
                                <i className="fas fa-external-link-alt mr-2" />{" "}
                                View Program Page
                              </a>
                            )}
                          {step.type === "exam" && (
                            <ExamStepComponent 
                              examName={step.name} 
                              examDescription={step.description}
                              onShowRequirements={(name, info) => setCertificationPopup({ name, info })}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Add Career Button - Only show if no additional careers have been added yet */}
            {comparisonPathways.length === 0 && !showAddCareerInput && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleAddCareerClick}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-md transition-colors"
                >
                  <i className="fas fa-plus mr-2" />
                  Compare Another Career
                </button>
              </div>
            )}

            {/* Add Career Input - Only show if no comparison pathways exist yet */}
            {showAddCareerInput && comparisonPathways.length === 0 && (
              <div className="mt-8 flex justify-center">
                <div className="w-full max-w-md">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={addCareerInput}
                      onChange={(e) => setAddCareerInput(e.target.value)}
                      onKeyDown={handleAddCareerKeyDown}
                      placeholder="Enter another career (e.g., Electrical Engineer)"
                      className="flex-1 py-2 pl-4 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={handleAddCareerGenerate}
                      disabled={!addCareerInput.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                    >
                      <i className="fas fa-arrow-right" />
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCareerInput(false);
                        setAddCareerInput("");
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Additional Career Pathways - Render independently of main pathway */}
        {comparisonPathways.length > 0 && (
          <div className={pathwayData ? "mt-12 space-y-12" : "space-y-12"}>
            {comparisonPathways.map((careerPathway, careerIndex) => (
              <div key={careerIndex} className={pathwayData ? "border-t border-gray-300 pt-8" : ""}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {careerPathway.career}
                  </h2>
                  <button
                    onClick={() => handleRemoveFromComparison(careerIndex)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Remove from comparison"
                  >
                    <i className="fas fa-times text-xl" />
                  </button>
                </div>

                {/* Pathway Tabs for this career */}
                {careerPathway.data.pathways.length > 1 && (
                  <div className="mb-6 border-b border-gray-200">
                    <nav className="flex space-x-1 overflow-x-auto" aria-label="Pathway Tabs">
                      {careerPathway.data.pathways.map((pathway, pathwayIndex) => (
                        <button
                          key={pathwayIndex}
                          onClick={() => handlePathwaySelectInComparison(careerIndex, pathwayIndex)}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            careerPathway.selectedPathwayIndex === pathwayIndex
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {pathway.isPrimary && (
                            <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          )}
                          {pathway.title}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}

                {/* Pathway Flowchart */}
                <div className="flowchart-container">
                  {careerPathway.data.pathways[careerPathway.selectedPathwayIndex].steps.map(
                    (step, stepIndex) => {
                      const stepTypeClass = `flowchart-step-${step.type}`;
                      const IconComponent = icons[step.type];

                      return (
                        <div key={stepIndex}>
                          {stepIndex > 0 && <div className="flowchart-connector" />}
                          <div className={`flowchart-step ${stepTypeClass}`}>
                            <div className="flowchart-step-header">
                              <div className="flowchart-step-header-icon">
                                {IconComponent}
                              </div>
                              <span className="text-xs font-semibold uppercase tracking-wider">
                                {step.level || step.type}
                              </span>
                            </div>
                            <div className="flowchart-step-content">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {step.name}
                              </h3>
                              <p className="text-gray-600 mt-2">{step.description}</p>
                              {step.type === "transfer" && (
                                <div className="mt-4 space-y-2">
                                  <button
                                    onClick={() => setTransferRecommendationsPopup(true)}
                                    className="w-full text-left text-sm font-semibold text-orange-700 hover:text-orange-800 focus:outline-none focus:underline flex items-center"
                                  >
                                    <i className="fas fa-info-circle mr-2" />
                                    Recommendations
                                  </button>
                                  <a
                                    href="https://www.mdc.edu/transfer-information/transfer-agreements/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150"
                                  >
                                    <i className="fas fa-external-link-alt mr-2" /> View
                                    Transfer Agreements
                                  </a>
                                </div>
                              )}
                              {step.type === "degree" &&
                                ((step.level.includes("MDC") &&
                                  !step.name.toLowerCase().includes("bachelor") &&
                                  (isMDCAssociateInScienceProgram(step.name) ||
                                    isMDCAssociateInArtsProgram(step.name))) ||
                                  step.name.toLowerCase().includes("certificate") ||
                                  (step.name.toLowerCase().includes("bachelor") &&
                                    isMDCBachelorsProgram(step.name))) && (
                                  <a
                                    href={getMDCProgramUrl(step.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                                  >
                                    <i className="fas fa-external-link-alt mr-2" />{" "}
                                    View Program Page
                                  </a>
                                )}
                              {step.type === "exam" && (
                                <ExamStepComponent 
                                  examName={step.name} 
                                  examDescription={step.description} 
                                  careerIndex={careerIndex}
                                  onShowRequirements={(name, info, idx) => setCertificationPopup({ name, info, careerIndex: idx })}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Add Career Button after last additional pathway - Only show if under limit */}
                {careerIndex === comparisonPathways.length - 1 && comparisonPathways.length < 3 && !showAddCareerInput && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleAddCareerClick}
                      className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-md transition-colors"
                    >
                      <i className="fas fa-plus mr-2" />
                      Compare Another Career
                    </button>
                  </div>
                )}

                {/* Add Career Input after last pathway */}
                {careerIndex === comparisonPathways.length - 1 && showAddCareerInput && (
                  <div className="mt-8 flex justify-center">
                    <div className="w-full max-w-md">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={addCareerInput}
                          onChange={(e) => setAddCareerInput(e.target.value)}
                          onKeyDown={handleAddCareerKeyDown}
                          placeholder="Enter another career (e.g., Electrical Engineer)"
                          className="flex-1 py-2 pl-4 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleAddCareerGenerate}
                          disabled={!addCareerInput.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                        >
                          <i className="fas fa-arrow-right" />
                        </button>
                        <button
                          onClick={() => {
                            setShowAddCareerInput(false);
                            setAddCareerInput("");
                          }}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                        >
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              <div className="loader" />
              <span className="text-gray-700 font-medium">
                {loadingMessage}
              </span>
            </div>
            <button
              onClick={handleCancelLoad}
              className="mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transfer Recommendations Popup */}
      {transferRecommendationsPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setTransferRecommendationsPopup(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Florida (In-State) University Transfer Recommendations
              </h2>
              <button
                onClick={() => setTransferRecommendationsPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </header>
            <main className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                MDC has strong articulation agreements with these Florida
                universities. Consider these options for your transfer:
              </p>
              <div className="space-y-4">
                {FLORIDA_UNIVERSITIES.map((university, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {university.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {university.location} • {university.type}
                        </p>
                      </div>
                      <a
                        href={university.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
                      >
                        Visit{" "}
                        <i className="fas fa-external-link-alt ml-1 text-xs" />
                      </a>
                    </div>
                    {university.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        {university.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href="https://www.mdc.edu/transfer-information/transfer-agreements/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150"
                >
                  <i className="fas fa-external-link-alt mr-2" /> View MDC
                  Transfer Agreements
                </a>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Certification Requirements Popup */}
      {certificationPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setCertificationPopup(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                {certificationPopup.name} - Requirements
              </h2>
              <button
                onClick={() => setCertificationPopup(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </header>
            <main className="p-6 overflow-y-auto">
              <ul className="space-y-2 text-sm text-gray-700 pl-5">
                {certificationPopup.info.requirements.map((req, idx) => (
                  <li
                    key={idx}
                    className="leading-relaxed list-disc list-outside"
                  >
                    {req}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href={certificationPopup.info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150"
                >
                  <i className="fas fa-external-link-alt mr-2" /> Visit Official
                  Website
                </a>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Message Modal for AI Content */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              hideModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <header className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
              <button
                onClick={hideModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </header>
            <main
              className="p-6 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: modalContent }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-600">
            {/* Resources Column */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://www.mdc.edu/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Miami Dade College
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.mdc.edu/advisement/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Academic Advising
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.mdc.edu/academics/programs/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Degree Programs
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="/privacy" 
                    className="hover:text-blue-600 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a 
                    href="/terms" 
                    className="hover:text-blue-600 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.mdc.edu/accessibility/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Accessibility
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Disclaimer Column */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Contact</h3>
              <p className="mb-4">
                <a 
                  href="mailto:advisement@mdc.edu" 
                  className="hover:text-blue-600 transition-colors"
                >
                  advisement@mdc.edu
                </a>
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>Disclaimer:</strong> Pathways are AI-generated suggestions and should be verified with academic advisors. Content may contain inaccuracies.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Miami Dade College. All rights reserved.</p>
            <p className="mt-1">Powered by Google Gemini AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
