// Professional certification & licensure exam catalog and the helpers that
// look up official URLs and requirement lists for a given exam name.

// Mapping of certifications/exams to their official websites and requirements
export interface CertificationInfo {
  url: string;
  requirements: string[];
}

export const CERTIFICATION_MAPPING: Record<string, CertificationInfo> = {
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

// Helper function to get certification/exam info (URL and requirements)
export function getCertificationInfo(examName: string): CertificationInfo | null {
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
export function parseRequirementsFromDescription(description: string | undefined, examName: string): string[] {
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
export function generateGenericRequirements(examName: string): string[] {
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
