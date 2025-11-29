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
    const { input } = await request.json();

    if (!input || typeof input !== "string" || input.trim() === "") {
      return NextResponse.json(
        {
          error: "Input parameter is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    const prompt = `You are a career advisor. A user has entered "${input}" as a career interest. 

Your task is to identify 3-5 specific, real career titles that match this input. These should be:
- Actual, recognized career titles (not made up)
- Specific enough to generate an educational pathway
- Related to the user's input

Return ONLY a JSON array of career titles as strings, nothing else. For example:
["Registered Nurse", "Certified Registered Nurse Anesthetist (CRNA)", "Certified Nurse-Midwife (CNM)", "Nurse Practitioner"]

If the input is already very specific (like "Registered Nurse"), return an array with just that one career.
If the input is too vague or not a real career, return an empty array.

Input: "${input}"
Return only the JSON array:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${genModel}:generateContent?key=${apiKey}`,
      {
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: `Gemini API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      return NextResponse.json(
        { error: "No response from Gemini API" },
        { status: 500 }
      );
    }

    // Try to extract JSON array from the response
    let suggestions: string[] = [];
    try {
      // Look for JSON array in the response
      const jsonMatch = generatedText.match(/\[.*?\]/s);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, try to parse the whole response
        suggestions = JSON.parse(generatedText.trim());
      }
    } catch (parseError) {
      // If parsing fails, try to extract career titles from text
      const lines = generatedText
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
      
      // Look for lines that look like career titles
      suggestions = lines
        .filter((line: string) => {
          // Remove list markers, quotes, etc.
          const cleaned = line.replace(/^[-•*]\s*/, "").replace(/^["']|["']$/g, "");
          return cleaned.length > 3 && cleaned.length < 100;
        })
        .map((line: string) => line.replace(/^[-•*]\s*/, "").replace(/^["']|["']$/g, ""))
        .slice(0, 5);
    }

    // Validate suggestions are strings
    suggestions = suggestions.filter(
      (s: any) => typeof s === "string" && s.trim().length > 0
    );

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Error getting career suggestions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get career suggestions" },
      { status: 500 }
    );
  }
}

