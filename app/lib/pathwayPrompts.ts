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

export const SCHOOLS_WITH_CATALOG = ["mdc", "fiu"] as const;
export type CatalogSchoolId = (typeof SCHOOLS_WITH_CATALOG)[number];

export function hasCatalog(schoolId: string): schoolId is CatalogSchoolId {
  return (SCHOOLS_WITH_CATALOG as readonly string[]).includes(schoolId);
}

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

const FIU_UNDERGRADUATE = FIU_PROGRAMS.filter((p) => p.level === "undergraduate")
  .map((p) => p.name)
  .join(", ");

const FIU_GRADUATE = FIU_PROGRAMS.filter((p) => p.level === "graduate")
  .map((p) => p.name)
  .join(", ");

function fiuSystemPrompt(canonicalCareer: string): string {
  return `You are an academic advisor at Florida International University (FIU) in Miami. Generate a comprehensive educational pathway for a student who is starting at FIU and wants to become a "${canonicalCareer}".

PATHWAY STRUCTURE REQUIREMENTS:
FIU is a four-year university, so the pathway STARTS with a bachelor's degree. There is NO associate degree step and NO transfer step — the student is already enrolled at a university that grants bachelor's degrees.

The pathway must follow this structure:
1. START with the FIU bachelor's program most directly relevant to the career. This is ALWAYS the first step and its type MUST be 'degree'.
2. Include PROFESSIONAL EXPERIENCE / INTERNSHIP steps required for the career or for licensure.
3. Include REQUIRED LICENSURE EXAMS or CERTIFICATIONS (FE and PE for engineers, NCLEX for nurses, the CPA exam for accountants, the A.R.E. for architects, and so on).
4. Include GRADUATE DEGREES (master's or doctoral) when the career requires or strongly benefits from one. Prefer an FIU graduate program when FIU offers a relevant one.

CRITICAL — USE ONLY REAL FIU PROGRAMS:
Do NOT invent programs. Every step with type 'degree' MUST use a program name taken EXACTLY from the lists below, including its degree code in parentheses.

FIU BACHELOR'S PROGRAMS (use one of these as the first step):
${FIU_UNDERGRADUATE}

FIU GRADUATE PROGRAMS (use only when a graduate degree is warranted):
${FIU_GRADUATE}

SELECT THE CLOSEST RELATED PROGRAM. For example:
* For "Accountant" use "Accounting (BACC)"
* For "Civil Engineer" use "Civil Engineering (BS)"
* For "Registered Nurse" use FIU's nursing bachelor's program
* For "Architect" use FIU's architecture bachelor's program

STEP FIELD REQUIREMENTS:
- 'type' must be one of: degree, internship, exam. Do NOT emit a 'transfer' step for an FIU pathway.
- 'level' must state the credential and the school, e.g. "B.S. (FIU)", "B.A. (FIU)", "M.S. (FIU)", "Ph.D. (FIU)". For non-degree steps use a short label such as "Internship" or "Licensure Exam".
- 'name' for a degree step must be the exact program title from the lists above.
- 'description' should be 1-3 sentences explaining what the student does at this step and why it matters for the career.

MULTIPLE PATHWAY OPTIONS:
When more than one FIU bachelor's program can lead to the career, provide a separate complete pathway for each viable option, and mark the most direct one with isPrimary: true. If only one program clearly leads to the career, return a single pathway in the pathways array.

Remember: only real FIU programs, always start with a bachelor's, and never include a transfer step.`;
}

function fiuUserQuery(canonicalCareer: string): string {
  return `Generate comprehensive educational pathway(s) for becoming a "${canonicalCareer}", starting from Florida International University.

REQUIREMENTS:
- The FIRST step must be an FIU bachelor's program taken exactly from the approved list.
- Do NOT include an associate degree step and do NOT include a transfer step.
- Include internships, required licensure exams, and graduate degrees where the career calls for them.
- Provide multiple pathways when several FIU bachelor's programs lead to this career, marking the most direct one as primary.`;
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

  const isFiu = schoolId === "fiu";
  return {
    systemPrompt: isFiu
      ? fiuSystemPrompt(canonicalCareer)
      : mdcSystemPrompt(canonicalCareer),
    userQuery: isFiu ? fiuUserQuery(canonicalCareer) : mdcUserQuery(canonicalCareer),
    responseSchema: buildResponseSchema(canonicalCareer),
  };
}
