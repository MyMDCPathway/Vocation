import { NextRequest, NextResponse } from "next/server";

// Server-side only - never exposed to the browser
const apiKey = process.env.GEMINI_API_KEY;
const genModel = "gemini-2.5-flash-preview-09-2025";

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { career } = await request.json();

    if (!career || typeof career !== "string" || career.trim() === "") {
      return NextResponse.json(
        {
          error: "Career parameter is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a career and academic advisor at Miami Dade College (MDC) North Campus. Your task is to generate a comprehensive, holistic educational pathway for a student interested in a specific career.

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

1. MDC PROGRAM SELECTION:
   - When selecting an MDC program, use your knowledge of programs listed on MDC's official program pages:
     * Associate Programs: https://www.mdc.edu/academics/programs/associate.aspx (includes both A.A. and A.S.)
     * Bachelor Programs: https://www.mdc.edu/academics/programs/bachelor.aspx
     * Certificate Programs: https://www.mdc.edu/academics/programs/certificate.aspx
   - CONSIDER ALL PROGRAM TYPES when determining the best pathway:
     * Associate of Science (A.S.) - Often better for technical careers (e.g., Nursing, Engineering Technology, Computer Science)
     * Associate of Arts (A.A.) - Better for transfer-oriented paths (e.g., Pre-Med, Pre-Law, General Education)
     * Certificate Programs - Can be excellent starting points for specific careers or can be combined with degrees
     * Bachelor's Programs - Use when MDC offers a bachelor's degree that directly leads to the career (e.g., B.S. in Nursing, B.S. in Information Systems Technology)
   - For ANY step with type 'degree', the 'name' field MUST contain the full, official program title, such as:
     * "Associate in Science in Nursing"
     * "Associate in Arts in Engineering - Mechanical"
     * "Certificate in [Program Name]"
     * "Bachelor of Science in [Program Name]"
     Do not use generic names.
   - If multiple MDC programs could lead to the same career, select the MOST DIRECT and EFFECTIVE pathway. Consider:
     * Which program provides the fastest route to employment?
     * Which program best prepares for required licensure/certifications?
     * Which program offers the best transfer opportunities if needed?
     * Can a certificate program serve as a stepping stone or entry point?

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

EXAMPLES:
- For Mechanical Engineer: A.A. in Engineering - Mechanical (MDC) -> Transfer to 4-year university -> B.S. in Mechanical Engineering -> Professional Engineering Experience -> FE Exam -> PE Exam -> Optional M.S. in Mechanical Engineering
- For Architect: A.A. in Architecture/Design (MDC) -> Transfer to architecture school -> B.Arch -> Architectural Experience Program (AXP) -> A.R.E. (all divisions) -> Optional M.Arch
- For Nurse: A.S. in Nursing (MDC) -> B.S.N. (MDC, if available) OR Transfer -> B.S.N. -> Clinical Experience -> NCLEX-RN -> Optional M.S.N.
- For IT Professional: Certificate in Information Technology (MDC) -> A.S. in Information Systems Technology (MDC) -> B.S. in Information Systems Technology (MDC) -> Professional Experience -> Optional Certifications
- For Medical Assistant: Certificate in Medical Assisting (MDC) -> Direct Employment -> Optional A.S. in Health Sciences for advancement

You must only respond with a JSON object following the schema provided.`;

    const pathwaySchema = {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: `Pathway to becoming a ${career}`,
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
      required: ["title", "steps"],
    };

    const userQuery = `Generate a comprehensive educational pathway for becoming a "${career}". 

The pathway must include:
- The BEST starting point from MDC: Associate of Science (A.S.), Associate of Arts (A.A.), Certificate Program, or Bachelor's Program (when MDC offers one)
- Transfer to a 4-year university (ONLY if bachelor's degree is required AND MDC doesn't offer a bachelor's program in that field)
- Bachelor's degree (if required - prefer MDC's bachelor's program if available)
- Required professional experience/internships
- All required licensure exams and certifications
- Optional advanced degrees (M.S., Ph.D.) when relevant

Consider all MDC program types (A.S., A.A., Certificates, and Bachelor's) and select the most direct and effective pathway. When MDC offers a bachelor's degree that directly leads to the career, use it instead of transfer.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${genModel}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: pathwaySchema,
      },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate pathway due to an external API error." },
        { status: 500 }
      );
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      const text = result.candidates[0].content.parts[0].text;
      const generatedData = JSON.parse(text);
      return NextResponse.json(generatedData);
    } else if (result.promptFeedback) {
      return NextResponse.json(
        { error: `Request blocked: ${result.promptFeedback.blockReason}` },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "No candidates returned from API." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate pathway due to an external API error." },
      { status: 500 }
    );
  }
}
