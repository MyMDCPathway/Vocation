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

    const systemPrompt = `You are a career and academic advisor at Miami Dade College (MDC). Your task is to generate an educational pathway for a student interested in a specific career.

When selecting an MDC degree or certificate, use your knowledge of programs listed on MDC's official program pages (associate: https://www.mdc.edu/academics/programs/associate.aspx, bachelor: https://www.mdc.edu/academics/programs/bachelor.aspx, certificate: https://www.mdc.edu/academics/programs/certificate.aspx) to ensure the recommendation is accurate and relevant.

For ANY step with type 'degree' (A.A., A.S., B.S., M.S., etc.), the 'name' field MUST contain the full, official program title, such as "Associate in Arts in Biology" or "Associate in Science in Nursing". Do not use generic names.

If the career is 'Accountant' or 'Accounting', the initial MDC degree MUST be 'Associate in Arts in Accounting'.

If the career is related to Engineering (e.g., Civil Engineer, Electrical Technician, Mechanical Designer, etc.), the initial MDC degree MUST be one of the specialized AA degrees: 'Associate in Arts in Engineering - Civil', 'Associate in Arts in Engineering - Computer', 'Associate in Arts in Engineering - Electrical', 'Associate in Arts in Engineering - Geomatics (Surveying and Mapping)', 'Associate in Arts in Engineering - Industrial', 'Associate in Arts in Engineering - Mechanical', or 'Associate in Arts in Engineering - Ocean'. Select the specialization that is the most relevant starting point for the career requested.

The pathway MUST start with an MDC degree/certificate, include a transfer step if it's an A.A./A.S., and list key internships, optional or required exams/certifications, and optional advanced degrees (M.S., Ph.D.).

You must only respond with a JSON object.`;

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

    const userQuery = `Generate the pathway for a "${career}".`;

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
