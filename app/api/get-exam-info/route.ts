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

  // Read request body once
  let examName: string;
  try {
    const body = await request.json();
    examName = body.examName;
    
    if (!examName || typeof examName !== "string" || examName.trim() === "") {
      return NextResponse.json(
        {
          error: "Exam name parameter is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body",
      },
      { status: 400 }
    );
  }

  try {

    const prompt = `You are a helpful assistant that finds official information about professional exams and certifications.

For the exam/certification: "${examName}"

Please provide:
1. The official website URL for this exam/certification (the first/main official website where candidates can register or learn about the exam)
2. A list of specific requirements needed to take this exam/certification

Format your response as JSON with this structure:
{
  "url": "https://official-website-url.com",
  "requirements": [
    "Requirement 1",
    "Requirement 2",
    "Requirement 3"
  ]
}

Important:
- Only provide the official website URL (not a search engine link)
- Requirements should be specific and actionable (e.g., "Bachelor's degree in engineering", "Pass the FE exam", "Complete 3,740 hours of experience")
- Include education prerequisites, application steps, exam format, experience requirements, etc.
- If you cannot find the official website, use a Google search URL: "https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}"
- Provide at least 3-5 requirements if available

Respond ONLY with valid JSON, no additional text.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${genModel}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch exam information" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return NextResponse.json(
        { error: "Invalid response from API" },
        { status: 500 }
      );
    }

    const responseText = data.candidates[0].content.parts[0].text.trim();
    
    // Try to extract JSON from the response
    let examInfo;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        examInfo = JSON.parse(jsonMatch[0]);
      } else {
        examInfo = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error("Failed to parse JSON:", responseText);
      // Fallback: return a search URL and generic requirements
      examInfo = {
        url: `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`,
        requirements: [
          "Check the official certification website for specific education prerequisites",
          "Complete required coursework or training program",
          "Apply for examination with the certifying organization",
          "Pass the required examination(s)",
          "Meet state-specific or jurisdiction-specific requirements"
        ]
      };
    }

    // Validate the response structure
    if (!examInfo.url || !examInfo.requirements || !Array.isArray(examInfo.requirements)) {
      examInfo = {
        url: `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`,
        requirements: [
          "Check the official certification website for specific education prerequisites",
          "Complete required coursework or training program",
          "Apply for examination with the certifying organization",
          "Pass the required examination(s)",
          "Meet state-specific or jurisdiction-specific requirements"
        ]
      };
    }

    return NextResponse.json(examInfo);
  } catch (error: any) {
    console.error("Error fetching exam info:", error);
    // Return fallback data with the exam name we already have
    return NextResponse.json(
      { 
        url: `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`,
        requirements: [
          "Check the official certification website for specific requirements",
          "Requirements may vary by state or jurisdiction",
          "Contact the certifying organization for the most current information"
        ]
      },
      { status: 200 } // Return 200 with fallback data instead of error
    );
  }
}

