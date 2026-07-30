// Per-school prompt construction for pathway generation.
//
// Each school needs a different pathway shape. A Miami Dade College pathway
// starts at an associate degree and routes through a transfer to a four-year
// university. A Florida International University pathway starts at the
// bachelor's itself — there is nothing to transfer into — so its prompt has no
// transfer step and reaches straight for graduate options instead.
//
// Both prompts are grounded in a real catalog of that school's programs. This
// is the fix for the model inventing plausible degrees that don't exist:
// constraining the output space beats instructing the model to be careful.
//
// Only schools listed in SCHOOLS_WITH_CATALOG can generate a pathway. The other
// 59 in floridaSchools.ts have no program data, and inventing a catalog for
// them would hand students a plan built on degrees that may not exist.
//
// The MDC prompt below was moved verbatim out of app/api/generate-pathway.

import { FIU_PROGRAMS } from "./fiu-programs";
import { FLORIDA_SCHOOLS } from "./floridaSchools";
import { AVEMARIA_PROGRAMS } from "./programs/avemaria";
import { BARRY_PROGRAMS } from "./programs/barry";
import { BROWARD_PROGRAMS } from "./programs/broward";
import { CF_PROGRAMS } from "./programs/cf";
import { CFK_PROGRAMS } from "./programs/cfk";
import { CHIPOLA_PROGRAMS } from "./programs/chipola";
import { COOKMAN_PROGRAMS } from "./programs/cookman";
import { DSC_PROGRAMS } from "./programs/dsc";
import { ECKERD_PROGRAMS } from "./programs/eckerd";
import { EFSC_PROGRAMS } from "./programs/efsc";
import { ERAU_PROGRAMS } from "./programs/erau";
import { EWU_PROGRAMS } from "./programs/ewu";
import { FAMU_PROGRAMS } from "./programs/famu";
import { FAU_PROGRAMS } from "./programs/fau";
import { FGC_PROGRAMS } from "./programs/fgc";
import { FGCU_PROGRAMS } from "./programs/fgcu";
import { FIT_PROGRAMS } from "./programs/fit";
import { FLAGLER_PROGRAMS } from "./programs/flagler";
import { FLPOLY_PROGRAMS } from "./programs/flpoly";
import { FMU_PROGRAMS } from "./programs/fmu";
import { FSC_PROGRAMS } from "./programs/fsc";
import { FSCJ_PROGRAMS } from "./programs/fscj";
import { FSU_PROGRAMS } from "./programs/fsu";
import { FSW_PROGRAMS } from "./programs/fsw";
import { GCSC_PROGRAMS } from "./programs/gcsc";
import { HCC_PROGRAMS } from "./programs/hcc";
import { IRSC_PROGRAMS } from "./programs/irsc";
import { JU_PROGRAMS } from "./programs/ju";
import { KEISER_PROGRAMS } from "./programs/keiser";
import { LSSC_PROGRAMS } from "./programs/lssc";
import { NOVA_PROGRAMS } from "./programs/nova";
import { LYNN_PROGRAMS } from "./programs/lynn";
import { UM_PROGRAMS } from "./programs/miami";
import { NCF_PROGRAMS } from "./programs/ncf";
import { NFC_PROGRAMS } from "./programs/nfc";
import { NWFSC_PROGRAMS } from "./programs/nwfsc";
import { PBA_PROGRAMS } from "./programs/pba";
import { PBSC_PROGRAMS } from "./programs/pbsc";
import { PHSC_PROGRAMS } from "./programs/phsc";
import { POLK_PROGRAMS } from "./programs/polk";
import { PSC_PROGRAMS } from "./programs/psc";
import { ROLLINS_PROGRAMS } from "./programs/rollins";
import { SAINTLEO_PROGRAMS } from "./programs/saintleo";
import { SCF_PROGRAMS } from "./programs/scf";
import { SF_PROGRAMS } from "./programs/sf";
import { SFSC_PROGRAMS } from "./programs/sfsc";
import { SJR_PROGRAMS } from "./programs/sjr";
import { SPC_PROGRAMS } from "./programs/spc";
import { SSC_PROGRAMS } from "./programs/ssc";
import { STETSON_PROGRAMS } from "./programs/stetson";
import { STU_PROGRAMS } from "./programs/stu";
import { TAMPA_PROGRAMS } from "./programs/tampa";
import { TSC_PROGRAMS } from "./programs/tsc";
import { UCF_PROGRAMS } from "./programs/ucf";
import { UF_PROGRAMS } from "./programs/uf";
import { UNF_PROGRAMS } from "./programs/unf";
import { USF_PROGRAMS } from "./programs/usf";
import { UWF_PROGRAMS } from "./programs/uwf";
import { VALENCIA_PROGRAMS } from "./programs/valencia";
import type { SchoolProgram } from "./programCatalog";
import { SCHOOLS_WITH_CATALOG, hasCatalog, type CatalogSchoolId } from "./schoolCatalogs";
import { transferAgreementFor } from "./transferAgreements";

export { SCHOOLS_WITH_CATALOG, hasCatalog };
export type { CatalogSchoolId };

export interface PathwayPromptRequest {
  systemPrompt: string;
  userQuery: string;
  responseSchema: Record<string, unknown>;
}

function buildResponseSchema(canonicalCareer: string): Record<string, unknown> {
  return {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: `The career name only (e.g., "${canonicalCareer}"). Do not include "Educational Pathway to becoming a" or similar prefixes.`,
        },
        pathways: {
          type: "ARRAY",
          description: "Array of alternative pathways. Provide multiple pathways when different MDC programs can lead to the same career. If only one pathway exists, provide an array with one pathway.",
          items: {
            type: "OBJECT",
            properties: {
              title: {
                type: "STRING",
                description: "Title of this specific pathway (e.g., 'Pathway 1: A.S. in Computer Information Technology' or 'Pathway 2: A.A. in Computer Science')",
              },
              isPrimary: {
                type: "BOOLEAN",
                description: "True if this is the primary/recommended pathway, false otherwise",
              },
              steps: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    type: {
                      type: "STRING",
                      enum: ["degree", "transfer", "internship", "exam"],
                    },
                    level: {
                      type: "STRING",
                      description:
                        "e.g., A.A. (MDC), B.S., M.S. (Optional), or type of step",
                    },
                    name: {
                      type: "STRING",
                      description: "Name of the degree, exam, or step",
                    },
                    description: {
                      type: "STRING",
                      description: "A 1-2 sentence description of this step.",
                    },
                  },
                  required: ["type", "level", "name", "description"],
                },
              },
            },
            required: ["title", "isPrimary", "steps"],
          },
        },
      },
      required: ["title", "pathways"],
  };
}

function mdcSystemPrompt(canonicalCareer: string): string {
  return `You are a career and academic advisor at Miami Dade College (MDC) North Campus. Your task is to generate a comprehensive, holistic educational pathway for a student interested in a specific career.

PATHWAY STRUCTURE REQUIREMENTS:
The pathway must follow this structure and include ALL relevant steps:
1. START with an appropriate MDC program - Choose the BEST starting point from:
   * Associate of Science (A.S.) programs - for technical/vocational careers
   * Associate of Arts (A.A.) programs - for transfer-oriented careers
   * Certificate Programs - for quick entry into specific careers or as stepping stones
   * Bachelor's programs (B.S./B.A.) - when MDC offers a bachelor's degree that directly leads to the career
   Select the program type that provides the most direct and effective pathway to the career.
2. Include a TRANSFER step to a 4-year university (if the career requires a bachelor's degree and MDC doesn't offer one, or if transfer is the better pathway)
3. Include B.S./B.A. degree step (if required for the career and not already completed at MDC)
4. Include PROFESSIONAL EXPERIENCE/INTERNSHIP steps (required for licensure or professional development)
5. Include REQUIRED LICENSURE EXAMS/CERTIFICATIONS (e.g., FE/PE for engineers, A.R.E. for architects, NCLEX for nurses, etc.)
6. Include OPTIONAL advanced degrees (M.S., M.A., Ph.D.) when relevant

SPECIFIC REQUIREMENTS:

1. MDC PROGRAM SELECTION - CRITICAL REQUIREMENTS:
   - YOU MUST ONLY USE ACTUAL MDC PROGRAMS THAT EXIST AT MDC. DO NOT CREATE OR INVENT PROGRAMS.
   - For Associate in Arts (A.A.) programs, you MUST select from these actual MDC programs:
     Accounting, Agriculture, Anthropology, Architecture, Area & Ethnic Studies, Art, Art Education, Atmospheric Science & Meteorology, Biology, Biotechnology, Building Construction, Business Administration, Chemistry, Computer Arts Animation, Computer Information Systems, Computer Science, Criminal Justice Administration, Dance, Dietetics, Drama, Drama Education, Economics, Engineering - Architectural, Engineering - Biomedical, Engineering - Chemical, Engineering - Civil, Engineering - Computer, Engineering - Electrical, Engineering - Geomatics (Surveying and Mapping), Engineering - Industrial, Engineering - Mechanical, Engineering - Ocean, English/Literature & English Education, Environmental Sciences, Exercise Science, Foreign Language, Forestry, Geology, Graphic or Commercial Arts, Health Services Administration, History, Hospitality Administration/Travel & Tourism, Interior Design, International Relations, Landscape Architecture, Mass Communications/Journalism, Mathematics, Music, Music Education, Philosophy, Physical Education Teaching & Coaching, Physics, Political Science, Pre-Bachelor of Arts, Pre-Law, Pre-Medical Science/Dentistry, Pre-Medical Technology, Pre-Nursing, Pre-Occupational Therapy, Pre-Optometry, Pre-Pharmacy, Pre-Physical Therapy, Pre-Veterinary Medicine, Psychology, Public Administration, Recreation, Religion, Social Work, Sociology, Speech Pathology & Audiology, Teaching (Elementary), Teaching (Exceptional Student Education), Teaching (Pre-Elementary/Early Childhood), Teaching (Secondary), Teaching Secondary (Biology), Teaching Secondary (Chemistry), Teaching Secondary (Earth/Space), Teaching Secondary (English/Foreign Languages), Teaching Secondary (Mathematics Education), Teaching Secondary (Physics), Teaching Secondary (Social Science), Teaching Secondary (Vocational: Business, Technical, Home)
   
   - For Associate in Science (A.S.) programs, you MUST select from these actual MDC programs:
     Accounting Technology, Animation & Game Art, Applied Artificial Intelligence, Architectural Design and Construction Technology, Aviation Administration, Aviation Maintenance Management, Biomedical Engineering Technology, Biotechnology, Biotechnology - Bioinformatics, Biotechnology - Chemical Technology, Building Construction Technology, Business Administration, Business Intelligence Specialist, Civil Engineering Technology, Clinical Laboratory Science, Computer Crime Investigation, Computer Engineering Technology, Computer Information Technology, Computer Programming and Analysis - Business Application Programming, Computer Programming and Analysis - Internet of Things (IoT) Applications, Computer Programming and Analysis - Mobile Applications Development, Crime Scene Technology - Crime Scene Investigation, Crime Scene Technology - Forensic Science, Criminal Justice Technology, Culinary Arts Management, Cybersecurity, Database Technology - Oracle Database Administration, Dental Hygiene, Diagnostic Medical Sonography, Early Childhood Education, Early Childhood Education - Administrators, Early Childhood Education - Infant Toddler, Early Childhood Education - Preschool, Electronics Engineering Technology, Emergency Medical Services, Entrepreneurship, Fashion Design, Fashion Merchandising, Film Production Technology, Financial Services - Banking, Financial Services - Wealth Management, Fire Science Technology, Funeral Service Education, Game Development & Design, Graphic Design Technology, Graphic Internet Technology, Health Information Technology, Health Science - Health Services Management, Health Sciences, Histologic Technology, Hospitality & Tourism Management, Interior Design Technology, Landscape & Horticulture Technology, Marketing, Music Business - Management and Marketing, Music Business - Performance and Production, Networking Services Technology - Enterprise Cloud Computing, Networking Services Technology - Network Infrastructure, Nuclear Medicine Technology, Nursing - R.N. (all variants), Opticianry, Paralegal Studies - ABA Approved, Photographic Technology, Physical Therapist Assistant, Professional Pilot Technology, Radiation Therapy, Radio & Television Broadcast Programming, Radiography, Respiratory Care, Sign Language Interpretation, Social and Human Services - Addictions Studies, Social and Human Services - Generalist, Sport Management, Surgical Technology, Translation/Interpretation Studies, Transportation and Logistics, Veterinary Technology
   
   - SELECT THE CLOSEST RELATED PROGRAM: When choosing an MDC program for a career, you MUST select the program that is MOST CLOSELY RELATED to that specific career. For example:
     * For "Mechanical Engineer" → Use "Associate in Arts in Engineering - Mechanical" (NOT generic Engineering)
     * For "Nurse" → Use "Associate in Science in Nursing" (NOT Health Sciences)
     * For "Architect" → Use "Associate in Arts in Architecture" or "Associate in Arts in Engineering - Architectural" (whichever is more appropriate)
     * For "Computer Programmer" → Use "Associate in Science in Computer Programming and Analysis" (NOT generic Computer Science)
     * For "Dental Hygienist" → Use "Associate in Science in Dental Hygiene"
     * For "Criminal Justice" careers → Use "Associate in Science in Criminal Justice Technology" or "Associate in Arts in Criminal Justice Administration" (choose based on career path)
   
   - For ANY step with type 'degree', the 'name' field MUST contain the full, official program title EXACTLY as listed above, such as:
     * "Associate in Science in Nursing"
     * "Associate in Arts in Engineering - Mechanical"
     * "Associate in Science in Computer Programming and Analysis - Mobile Applications Development"
     * "Certificate in [Program Name]" (only if MDC offers that certificate)
     * "Bachelor of Science in [Program Name]" (only if MDC offers that bachelor's program)
     DO NOT use generic names or create programs that don't exist.
   
   - MULTIPLE PATHWAY OPTIONS: When multiple MDC programs could lead to the same career, you MUST provide ALL viable alternative pathways:
     * Generate separate pathways for each valid MDC program option (e.g., A.S. vs A.A., different specializations)
     * Each alternative pathway should be a complete, valid route to the career
     * Clearly indicate which pathway is the primary/recommended option
     * Include pathways that offer different benefits (e.g., faster entry vs. more comprehensive preparation)
     * For example, for "IT Professional": provide one pathway starting with "Associate in Science in Computer Information Technology" and another starting with "Associate in Science in Computer Programming and Analysis"
     * For "Criminal Justice" careers: provide pathways for both "Associate in Science in Criminal Justice Technology" and "Associate in Arts in Criminal Justice Administration"
     * When only one MDC program clearly leads to the career, provide just that one pathway

2. TRANSFER STEPS:
   - Include a transfer step ONLY if:
     * The career requires a bachelor's degree AND MDC doesn't offer a bachelor's program in that field, OR
     * Transfer to a specialized program (e.g., architecture, pharmacy) is required, OR
     * Transfer provides a better pathway than completing a bachelor's at MDC
   - If MDC offers a bachelor's degree that directly leads to the career, DO NOT include a transfer step - use MDC's bachelor's program instead
   - The transfer step should mention articulation agreements and transfer to accredited institutions (e.g., FIU, UF, UCF, etc.)
   - Include information about GPA requirements, portfolio requirements (for design fields), or other admission prerequisites

3. PROFESSIONAL EXPERIENCE/INTERNSHIPS:
   - Include required professional experience programs (e.g., Architectural Experience Program (AXP) for architects, clinical rotations for healthcare, etc.)
   - Specify required hours when applicable (e.g., "3,740 hours of diverse professional experience")
   - Mention supervision requirements (e.g., "under the supervision of a licensed professional")

4. LICENSURE EXAMS AND CERTIFICATIONS:
   - Include ALL required licensure exams for the career:
     * For Engineers: Fundamentals of Engineering (FE) exam AND Principles and Practice of Engineering (PE) exam
     * For Architects: Architect Registration Examination (A.R.E.) - mention all required divisions
     * For Nurses: NCLEX-RN or NCLEX-PN
     * For other licensed professions: include the specific required exams
   - Include any required certifications or continuing education requirements
   - Mark exams as "REQUIRED" in the description
   - CRITICAL: For exam steps, the 'description' field MUST include specific requirements in a structured format. List requirements as separate bullet points or numbered items, such as:
     * "Requirements: Bachelor's degree in engineering (or in final year), Registration with state engineering board, Pass the FE exam (6-hour computer-based exam)"
     * "Requirements: Graduate from accredited nursing program, Apply for licensure with state board, Receive Authorization to Test (ATT), Pass the NCLEX-RN exam"
     * Include education prerequisites, application steps, exam format, and any state-specific requirements when known

5. ADVANCED DEGREES:
   - Include optional M.S., M.A., M.Arch, or Ph.D. degrees when relevant for career advancement
   - Clearly mark these as "(OPTIONAL)" in the level or description
   - Mention specialized fields (e.g., "Master of Science in specialized field" or "Master of Architecture")

6. PATHWAY FLOW:
   - The pathway should logically flow based on the best route:
     * Certificate (MDC) -> A.S./A.A. (MDC) -> Transfer -> B.S./B.A. -> Professional Experience -> Licensure Exams -> Optional Advanced Degrees
     * OR: A.S./A.A. (MDC) -> B.S./B.A. (MDC) -> Professional Experience -> Licensure Exams -> Optional Advanced Degrees
     * OR: Certificate (MDC) -> Direct Employment -> Optional Further Education
   - Each step should build upon the previous one
   - Include clear descriptions (1-2 sentences) explaining what each step entails and why it's necessary
   - When MDC offers a bachelor's program, prefer using it over transfer when it directly leads to the career

EXAMPLES (using ACTUAL MDC programs):
- For Mechanical Engineer: "Associate in Arts in Engineering - Mechanical" (MDC) -> Transfer to 4-year university -> B.S. in Mechanical Engineering -> Professional Engineering Experience -> FE Exam -> PE Exam -> Optional M.S. in Mechanical Engineering
- For Architect: "Associate in Arts in Architecture" or "Associate in Arts in Engineering - Architectural" (MDC) -> Transfer to architecture school -> B.Arch -> Architectural Experience Program (AXP) -> A.R.E. (all divisions) -> Optional M.Arch
- For Nurse: "Associate in Science in Nursing" (MDC) -> B.S.N. (MDC, if available) OR Transfer -> B.S.N. -> Clinical Experience -> NCLEX-RN -> Optional M.S.N.
- For IT Professional: "Associate in Science in Computer Information Technology" or "Associate in Science in Computer Programming and Analysis" (MDC) -> B.S. in Information Systems Technology (MDC, if available) -> Professional Experience -> Optional Certifications
- For Dental Hygienist: "Associate in Science in Dental Hygiene" (MDC) -> Direct Employment -> Licensure Exam -> Optional B.S. for advancement
- For Computer Programmer: "Associate in Science in Computer Programming and Analysis - Mobile Applications Development" or "Associate in Science in Computer Programming and Analysis - Business Application Programming" (MDC) -> Transfer or B.S. -> Professional Experience

You must only respond with a JSON object following the schema provided.`;
}

function mdcUserQuery(canonicalCareer: string): string {
  return `Generate comprehensive educational pathway(s) for becoming a "${canonicalCareer}". 

CRITICAL REQUIREMENTS:
- You MUST provide MULTIPLE alternative pathways when different MDC programs can lead to the same career
- For each pathway, select an MDC Associate in Arts (A.A.) or Associate in Science (A.S.) program that ACTUALLY EXISTS at MDC
- Use the exact program names from the list provided in the system instructions
- When multiple valid MDC programs exist for this career, create separate pathways for each:
  * Example: For "IT Professional" - create one pathway with "Associate in Science in Computer Information Technology" and another with "Associate in Science in Computer Programming and Analysis"
  * Example: For "Criminal Justice" - create one pathway with "Associate in Science in Criminal Justice Technology" and another with "Associate in Arts in Criminal Justice Administration"
  * Mark the most direct/recommended pathway as primary (isPrimary: true)
- Each pathway must include:
  * The MDC program as the starting point (A.S., A.A., Certificate, or Bachelor's - only if MDC offers it)
  * Transfer to a 4-year university (ONLY if bachelor's degree is required AND MDC doesn't offer a bachelor's program in that field)
  * Bachelor's degree (if required - prefer MDC's bachelor's program if available)
  * Required professional experience/internships
  * All required licensure exams and certifications
  * Optional advanced degrees (M.S., Ph.D.) when relevant
- If only one MDC program clearly leads to this career, provide just one pathway (but still in the pathways array)

Remember: Only use actual MDC programs that exist. Provide alternative routes when multiple programs are viable options for "${canonicalCareer}".`;
}

// --- Generic university prompt ---------------------------------------------
//
// A public university's pathway starts at the bachelor's — no associate step,
// no transfer step, because the student is already at a four-year school. This
// was originally FIU's own hard-coded prompt; it's the template every SUS
// university (§13 of HANDOFF.md) shares, parameterized the same way
// collegeSystemPrompt is for the state colleges. Adding a university is a
// scraper plus a registry entry here, not a new hand-written prompt.
//
// Unlike a college catalog, a university's programs already carry their
// credential code inside the name itself (FIU lists "Accounting (BACC)", not
// name="Accounting" + credential="BACC"), so programList's credential-suffix
// behavior is a no-op here — it just prints the name.

interface UniversityCatalog {
  schoolName: string;
  shortName: string;
  programs: SchoolProgram[];
}

const UNIVERSITY_SHORT_NAMES: Record<string, string> = {
  fiu: "FIU",
  ucf: "UCF",
  uf: "UF",
  fgcu: "FGCU",
  uwf: "UWF",
  ncf: "NCF",
  unf: "UNF",
  flpoly: "FlPoly",
  usf: "USF",
  fau: "FAU",
  famu: "FAMU",
  fsu: "FSU",
  miami: "UM",
  stetson: "Stetson",
  erau: "ERAU",
  tampa: "UT",
  barry: "Barry",
  lynn: "Lynn",
  rollins: "Rollins",
  flagler: "Flagler",
  pba: "PBA",
  fit: "Florida Tech",
  saintleo: "Saint Leo",
  stu: "STU",
  avemaria: "Ave Maria",
  cookman: "Bethune-Cookman",
  eckerd: "Eckerd",
  fmu: "Florida Memorial",
  ju: "Jacksonville University",
  keiser: "Keiser",
  fsc: "Florida Southern",
  nova: "Nova Southeastern",
  ewu: "Edward Waters",
};

const UNIVERSITY_PROGRAMS: Record<string, SchoolProgram[]> = {
  fiu: FIU_PROGRAMS,
  ucf: UCF_PROGRAMS,
  uf: UF_PROGRAMS,
  fgcu: FGCU_PROGRAMS,
  uwf: UWF_PROGRAMS,
  ncf: NCF_PROGRAMS,
  unf: UNF_PROGRAMS,
  flpoly: FLPOLY_PROGRAMS,
  usf: USF_PROGRAMS,
  fau: FAU_PROGRAMS,
  famu: FAMU_PROGRAMS,
  fsu: FSU_PROGRAMS,
  miami: UM_PROGRAMS,
  stetson: STETSON_PROGRAMS,
  erau: ERAU_PROGRAMS,
  tampa: TAMPA_PROGRAMS,
  barry: BARRY_PROGRAMS,
  lynn: LYNN_PROGRAMS,
  rollins: ROLLINS_PROGRAMS,
  flagler: FLAGLER_PROGRAMS,
  pba: PBA_PROGRAMS,
  fit: FIT_PROGRAMS,
  saintleo: SAINTLEO_PROGRAMS,
  stu: STU_PROGRAMS,
  avemaria: AVEMARIA_PROGRAMS,
  cookman: COOKMAN_PROGRAMS,
  eckerd: ECKERD_PROGRAMS,
  fmu: FMU_PROGRAMS,
  ju: JU_PROGRAMS,
  keiser: KEISER_PROGRAMS,
  fsc: FSC_PROGRAMS,
  nova: NOVA_PROGRAMS,
  ewu: EWU_PROGRAMS,
};

function universityCatalog(schoolId: string): UniversityCatalog | null {
  const programs = UNIVERSITY_PROGRAMS[schoolId];
  const shortName = UNIVERSITY_SHORT_NAMES[schoolId];
  if (!programs || !shortName) return null;

  const schoolName = FLORIDA_SCHOOLS.find((s) => s.id === schoolId)?.name;
  if (!schoolName) return null;

  return { schoolName, shortName, programs };
}

function universitySystemPrompt(
  school: UniversityCatalog,
  canonicalCareer: string
): string {
  const undergrad = programList(school.programs, "bachelor");
  const graduate = programList(school.programs, "graduate");

  return `You are an academic advisor at ${school.schoolName} (${school.shortName}). Generate a comprehensive educational pathway for a student who is starting at ${school.shortName} and wants to become a "${canonicalCareer}".

PATHWAY STRUCTURE REQUIREMENTS:
${school.shortName} is a four-year university, so the pathway STARTS with a bachelor's degree. There is NO associate degree step and NO transfer step — the student is already enrolled at a university that grants bachelor's degrees.

The pathway must follow this structure:
1. START with the ${school.shortName} bachelor's program most directly relevant to the career. This is ALWAYS the first step and its type MUST be 'degree'.
2. Include PROFESSIONAL EXPERIENCE / INTERNSHIP steps required for the career or for licensure.
3. Include REQUIRED LICENSURE EXAMS or CERTIFICATIONS (FE and PE for engineers, NCLEX for nurses, the CPA exam for accountants, the A.R.E. for architects, and so on).
4. Include GRADUATE DEGREES (master's or doctoral) when the career requires or strongly benefits from one. Prefer a ${school.shortName} graduate program when ${school.shortName} offers a relevant one.

CRITICAL — USE ONLY REAL ${school.shortName.toUpperCase()} PROGRAMS:
Do NOT invent programs. Every step with type 'degree' MUST use a program name taken EXACTLY from the lists below, including its degree code in parentheses.

${school.shortName.toUpperCase()} BACHELOR'S PROGRAMS (use one of these as the first step):
${undergrad}

${school.shortName.toUpperCase()} GRADUATE PROGRAMS (use only when a graduate degree is warranted):
${graduate}

SELECT THE CLOSEST RELATED PROGRAM.

STEP FIELD REQUIREMENTS:
- 'type' must be one of: degree, internship, exam. Do NOT emit a 'transfer' step for a ${school.shortName} pathway.
- 'level' must state the credential and the school, e.g. "B.S. (${school.shortName})", "B.A. (${school.shortName})", "M.S. (${school.shortName})", "Ph.D. (${school.shortName})". For non-degree steps use a short label such as "Internship" or "Licensure Exam".
- 'name' for a degree step must be the exact program title from the lists above.
- 'description' should be 1-3 sentences explaining what the student does at this step and why it matters for the career.

MULTIPLE PATHWAY OPTIONS:
When more than one ${school.shortName} bachelor's program can lead to the career, provide a separate complete pathway for each viable option, and mark the most direct one with isPrimary: true. If only one program clearly leads to the career, return a single pathway in the pathways array.

Remember: only real ${school.shortName} programs, always start with a bachelor's, and never include a transfer step.`;
}

function universityUserQuery(
  school: UniversityCatalog,
  canonicalCareer: string
): string {
  return `Generate comprehensive educational pathway(s) for becoming a "${canonicalCareer}", starting from ${school.schoolName}.

REQUIREMENTS:
- The FIRST step must be ${article(school.shortName)} ${school.shortName} bachelor's program taken exactly from the approved list.
- Do NOT include an associate degree step and do NOT include a transfer step.
- Include internships, required licensure exams, and graduate degrees where the career calls for them.
- Provide multiple pathways when several ${school.shortName} bachelor's programs lead to this career, marking the most direct one as primary.`;
}

// --- Generic state-college prompt -----------------------------------------
//
// MDC's prompt above is hand-tuned and its pathways are already seeded, so it
// stays as-is. Every OTHER Florida College System school shares one shape —
// start at an associate, transfer out for the bachelor's — so they share this
// template, parameterized by the school's own catalog. Adding the next college
// is then a scraper plus a registry entry, not another 13,000-character prompt.

interface CollegeCatalog {
  schoolName: string;
  shortName: string;
  programs: SchoolProgram[];
}

// schoolName is looked up in FLORIDA_SCHOOLS rather than repeated here, so the
// name a student sees in the school selector and the name the model is told it
// advises for cannot drift apart. shortName stays explicit because it is prose
// ("a Broward program"), not the abbreviation the selector shows ("BC").
const COLLEGE_SHORT_NAMES: Record<string, string> = {
  broward: "Broward",
  cf: "CF",
  efsc: "EFSC",
  fgc: "FGC",
  fscj: "FSCJ",
  fsw: "FSW",
  nwfsc: "NWFSC",
  polk: "Polk State",
  psc: "PSC",
  scf: "SCF",
  sf: "SF",
  sfsc: "SFSC",
  sjr: "SJR",
  cfk: "CFK",
  chipola: "Chipola",
  gcsc: "GCSC",
  irsc: "IRSC",
  tsc: "TSC",
  valencia: "Valencia",
  daytona: "Daytona State",
  hcc: "HCC",
  lssc: "LSSC",
  nfc: "NFC",
  pbsc: "PBSC",
  phsc: "PHSC",
  spc: "SPC",
  seminole: "Seminole State",
};

const COLLEGE_PROGRAMS: Record<string, SchoolProgram[]> = {
  broward: BROWARD_PROGRAMS,
  cf: CF_PROGRAMS,
  efsc: EFSC_PROGRAMS,
  fgc: FGC_PROGRAMS,
  fscj: FSCJ_PROGRAMS,
  fsw: FSW_PROGRAMS,
  nwfsc: NWFSC_PROGRAMS,
  polk: POLK_PROGRAMS,
  psc: PSC_PROGRAMS,
  scf: SCF_PROGRAMS,
  sf: SF_PROGRAMS,
  sfsc: SFSC_PROGRAMS,
  sjr: SJR_PROGRAMS,
  cfk: CFK_PROGRAMS,
  chipola: CHIPOLA_PROGRAMS,
  gcsc: GCSC_PROGRAMS,
  irsc: IRSC_PROGRAMS,
  tsc: TSC_PROGRAMS,
  valencia: VALENCIA_PROGRAMS,
  // dsc.ts / ssc.ts are the catalog files; "daytona" / "seminole" are the
  // floridaSchools.ts ids these are keyed under (see programCatalogs.ts).
  daytona: DSC_PROGRAMS,
  hcc: HCC_PROGRAMS,
  lssc: LSSC_PROGRAMS,
  nfc: NFC_PROGRAMS,
  pbsc: PBSC_PROGRAMS,
  phsc: PHSC_PROGRAMS,
  spc: SPC_PROGRAMS,
  seminole: SSC_PROGRAMS,
};

function collegeCatalog(schoolId: string): CollegeCatalog | null {
  const programs = COLLEGE_PROGRAMS[schoolId];
  const shortName = COLLEGE_SHORT_NAMES[schoolId];
  if (!programs || !shortName) return null;

  const schoolName = FLORIDA_SCHOOLS.find((s) => s.id === schoolId)?.name;
  if (!schoolName) return null;

  return { schoolName, shortName, programs };
}

// "an FSW program", not "a FSW program". Initialisms take "an" whenever the
// first letter is *said* with a leading vowel sound (F is "eff", so it does;
// C is "see", so it does not).
const LETTER_SOUNDS_LIKE_VOWEL = /^[AEFHILMNORSX]/;

function article(name: string): "a" | "an" {
  const isInitialism = name === name.toUpperCase();
  const takesAn = isInitialism
    ? LETTER_SOUNDS_LIKE_VOWEL.test(name)
    : /^[aeiou]/i.test(name);
  return takesAn ? "an" : "a";
}

function programList(programs: SchoolProgram[], level: SchoolProgram["level"]): string {
  return programs
    .filter((p) => p.level === level)
    .map((p) => (p.credential ? `${p.name} (${p.credential})` : p.name))
    .join(", ");
}

// The transfer step is the one a student actually has to plan, so name the
// school's real partner instead of saying "a four-year university". The
// statewide 2+2 floor is stated alongside it so the model does not present the
// named partner as the student's only option.
function transferPartnerSection(schoolId: string, shortName: string): string {
  const agreement = transferAgreementFor(schoolId);
  if (!agreement) return "";

  const also = agreement.alsoPartnersWith?.length
    ? ` ${shortName} also holds transfer agreements with ${agreement.alsoPartnersWith.join(", ")}.`
    : "";

  return `
TRANSFER PARTNER:
${shortName}'s flagship articulation agreement is "${agreement.programName}" with ${agreement.university} (${agreement.universityShortName}). ${agreement.summary}${also}

When you emit a transfer step, default to ${agreement.universityShortName} and name "${agreement.programName}" in the description. Choose a different university only when the career needs a program ${agreement.universityShortName} does not offer — and say why. Florida's statewide 2+2 articulation separately guarantees Associate in Arts graduates admission to one of the twelve State University System universities, so other public universities remain legitimate destinations; never imply ${agreement.universityShortName} is the only option.
`;
}

function collegeSystemPrompt(
  schoolId: string,
  school: CollegeCatalog,
  canonicalCareer: string
): string {
  const associates = programList(school.programs, "associate");
  const bachelors = programList(school.programs, "bachelor");
  const certificates = programList(school.programs, "certificate");
  const transferPartner = transferPartnerSection(schoolId, school.shortName);

  return `You are an academic advisor at ${school.schoolName}, a Florida College System institution. Generate a comprehensive educational pathway for a student starting at ${school.shortName} who wants to become a "${canonicalCareer}".

PATHWAY STRUCTURE REQUIREMENTS:
${school.shortName} is a two-year college that also grants some bachelor's degrees. The pathway must follow this structure:
1. START with the ${school.shortName} program that most directly serves the career:
   * An Associate of Science (A.S.) for technical and career-focused paths
   * The Associate of Arts (A.A.) when the career requires transferring to a university for a bachelor's
   * A certificate when it is a genuine entry point or a stepping stone
   * ${article(school.shortName) === "an" ? "An" : "A"} ${school.shortName} bachelor's degree when one directly leads to the career
2. Include a TRANSFER step to a four-year university when the career needs a bachelor's that ${school.shortName} does not itself offer.
3. Include the BACHELOR'S degree step when the career requires one.
4. Include PROFESSIONAL EXPERIENCE / INTERNSHIP steps required for the career or for licensure.
5. Include REQUIRED LICENSURE EXAMS or CERTIFICATIONS (FE and PE for engineers, NCLEX for nurses, the CPA exam for accountants, and so on).
6. Include OPTIONAL graduate degrees (M.S., M.A., Ph.D.) where they matter for advancement.

CRITICAL — USE ONLY REAL ${school.shortName.toUpperCase()} PROGRAMS:
Do NOT invent programs. Any step taken AT ${school.shortName} must use a program name EXACTLY as written in the lists below. Steps at a transfer university are not constrained by these lists.

${school.shortName.toUpperCase()} ASSOCIATE DEGREES:
${associates}

${school.shortName.toUpperCase()} BACHELOR'S DEGREES:
${bachelors}

${school.shortName.toUpperCase()} CERTIFICATES:
${certificates}
${transferPartner}
STEP FIELD REQUIREMENTS:
- 'type' must be one of: degree, transfer, internship, exam.
- 'level' must state the credential and, for steps at ${school.shortName}, the school: "A.A. (${school.shortName})", "A.S. (${school.shortName})", "B.S. (${school.shortName})". For a bachelor's earned after transferring, use "B.S." or "B.A." without a school. For non-degree steps use a short label such as "Transfer", "Internship", or "Licensure Exam".
- 'name' for a degree step at ${school.shortName} must be the exact program title from the lists above.
- 'description' should be 1-3 sentences on what the student does at this step and why it matters.

MULTIPLE PATHWAY OPTIONS:
When more than one ${school.shortName} program leads to the career, provide a separate complete pathway for each viable option and mark the most direct one with isPrimary: true. If only one program clearly leads there, return a single pathway in the pathways array.

Remember: only real ${school.shortName} programs, and always start at ${school.shortName}.`;
}

function collegeUserQuery(
  schoolId: string,
  school: CollegeCatalog,
  canonicalCareer: string
): string {
  const agreement = transferAgreementFor(schoolId);
  const transferLine = agreement
    ? `- Include a transfer step when the career requires a bachelor's that ${school.shortName} does not offer, defaulting to ${agreement.universityShortName} via ${agreement.programName}.`
    : `- Include a transfer step when the career requires a bachelor's that ${school.shortName} does not offer.`;

  return `Generate comprehensive educational pathway(s) for becoming a "${canonicalCareer}", starting from ${school.schoolName}.

REQUIREMENTS:
- The FIRST step must be ${article(school.shortName)} ${school.shortName} program taken exactly from the approved lists.
${transferLine}
- Include internships, required licensure exams, and graduate degrees where the career calls for them.
- Provide multiple pathways when several ${school.shortName} programs lead to this career, marking the most direct one as primary.`;
}

/**
 * Builds the Gemini request for a career at a given school, or null when that
 * school has no program catalog and therefore cannot be planned against.
 */
export function buildPathwayRequest(
  schoolId: string,
  canonicalCareer: string
): PathwayPromptRequest | null {
  if (!hasCatalog(schoolId)) return null;

  const responseSchema = buildResponseSchema(canonicalCareer);

  const university = universityCatalog(schoolId);
  if (university) {
    return {
      systemPrompt: universitySystemPrompt(university, canonicalCareer),
      userQuery: universityUserQuery(university, canonicalCareer),
      responseSchema,
    };
  }

  const college = collegeCatalog(schoolId);
  if (college) {
    return {
      systemPrompt: collegeSystemPrompt(schoolId, college, canonicalCareer),
      userQuery: collegeUserQuery(schoolId, college, canonicalCareer),
      responseSchema,
    };
  }

  return {
    systemPrompt: mdcSystemPrompt(canonicalCareer),
    userQuery: mdcUserQuery(canonicalCareer),
    responseSchema,
  };
}
