// MDC program catalog: name -> official URL mappings and the helpers that
// resolve a free-text program name to the correct mdc.edu page.

// Key: program name (normalized for matching), Value: exact URL
export const MDC_BACHELORS_URL_MAPPING: Record<string, string> = {
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
export function isMDCBachelorsProgram(programName: string): boolean {
  const normalizedName = programName.toLowerCase().trim();
  // Check if any key in the mapping matches the program name
  return Object.keys(MDC_BACHELORS_URL_MAPPING).some((key) =>
    normalizedName.includes(key)
  );
}

// Helper function to get the exact URL for an MDC bachelor's program
export function getMDCBachelorsProgramUrl(programName: string): string | null {
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
export function extractFirstProgramOption(programName: string): string {
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
export const MDC_ASSOCIATE_ARTS_URL_MAPPING: Record<string, string> = {
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
export function getMDCAssociateArtsProgramUrl(programName: string): string | null {
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
export function isMDCAssociateInArtsProgram(programName: string): boolean {
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
export const MDC_ASSOCIATE_SCIENCE_URL_MAPPING: Record<string, string> = {
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
export function getMDCAssociateScienceProgramUrl(programName: string): string | null {
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
export function isMDCAssociateInScienceProgram(programName: string): boolean {
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

// Helper function to convert program name to MDC URL slug
export function getMDCProgramUrl(programName: string): string {
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
