import { NextRequest, NextResponse } from "next/server";
import { enforceGenerationLimits, recordGeneration } from "@/app/lib/rateLimit";
import { geminiUrl } from "@/app/lib/geminiModel";
import { normalizeCareer } from "@/app/lib/careerCanonical";
import {
  blockedCareer,
  BLOCKED_CAREER_MESSAGE,
  MAX_ASSESSMENT_ANSWERS,
  MAX_ASSESSMENT_FIELD,
} from "@/app/lib/careerPolicy";

// Server-side only - never exposed to the browser
const apiKey = process.env.GEMINI_API_KEY;

interface QuizAnswer {
  question: string;
  answer: string | string[];
}

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { answers } = await request.json();

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        {
          error: "Answers parameter is required and must be a non-empty array.",
        },
        { status: 400 }
      );
    }

    // Nothing on this route is cached — quiz answers are unique per
    // submission — so every request without exception spends a Gemini call.
    // That makes it the one place where the caller alone decides how big a
    // billed prompt gets, and the only defence is refusing an oversized
    // submission before making the call. Hence the caps on both the number of
    // rows and the length of each string in them.
    if (answers.length > MAX_ASSESSMENT_ANSWERS) {
      return NextResponse.json(
        { error: `Send at most ${MAX_ASSESSMENT_ANSWERS} answers.` },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    for (const item of answers as QuizAnswer[]) {
      if (!item || typeof item !== "object") {
        return NextResponse.json(
          { error: "Each answer must have a question and an answer." },
          { status: 400 }
        );
      }
      const parts = Array.isArray(item.answer)
        ? [item.question, ...item.answer]
        : [item.question, item.answer];
      for (const part of parts) {
        if (typeof part !== "string") {
          return NextResponse.json(
            { error: "Questions and answers must be strings." },
            { status: 400 }
          );
        }
        if (part.length > MAX_ASSESSMENT_FIELD) {
          return NextResponse.json(
            { error: `Keep each answer under ${MAX_ASSESSMENT_FIELD} characters.` },
            { status: 400 }
          );
        }
        fields.push(part);
      }
    }

    // Both sides of every row are concatenated into the prompt below, so the
    // policy runs across all of them. There is no career field on this route
    // to check instead — the free text IS the input.
    if (fields.some((field) => blockedCareer(normalizeCareer(field)))) {
      return NextResponse.json(
        { error: BLOCKED_CAREER_MESSAGE, blocked: true },
        { status: 400 }
      );
    }

    // Only now, with the submission known to be a sane size, does anything
    // get spent.
    const limited = enforceGenerationLimits(request);
    if (limited) return limited;
    recordGeneration();

    // Build a detailed prompt from the quiz answers
    let answersText = "User's Career Assessment Answers:\n\n";
    answers.forEach((item: QuizAnswer, index: number) => {
      const answerValue = Array.isArray(item.answer) 
        ? item.answer.join(", ") 
        : item.answer;
      answersText += `${index + 1}. ${item.question}\n   Answer: ${answerValue}\n\n`;
    });

    const prompt = `You are an expert career counselor. Based on the following assessment answers, recommend 6-10 careers that best match this person's profile.

${answersText}

For each recommended career, provide:
- "title": The exact job title (string)
- "description": A brief 1-2 sentence description of what they do (string)
- "salary": The median annual salary in USD, formatted like "$75,000 - $85,000" or "$100,000" (string)
- "jobOutlook": Job market outlook - one of: "High demand", "Growing field", "Moderate demand", or "Competitive" (string)
- "competitiveness": How competitive the field is - one of: "Highly competitive", "Moderately competitive", "Less competitive", or "Very competitive" (string)
- "matchReason": A brief 1-2 sentence explanation of why this career matches their profile based on their answers (string)

Return ONLY a valid JSON array of objects. Each object must have these exact fields: "title", "description", "salary", "jobOutlook", "competitiveness", "matchReason".

Ensure the careers are diverse and cover different industries/roles that align with the user's responses. Prioritize careers that strongly match multiple aspects of their profile.

Return the JSON array now:`;

    const response = await fetch(
      geminiUrl(apiKey),
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
            maxOutputTokens: 4096,
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

    console.log("Gemini response text (first 1000 chars):", generatedText.substring(0, 1000));

    // Parse JSON from response
    let careers: Array<{
      title: string;
      description: string;
      salary: string;
      jobOutlook: string;
      competitiveness: string;
      matchReason: string;
    }> = [];

    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = generatedText.trim();
      cleanedText = cleanedText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      // Find balanced brackets for JSON array
      let bracketCount = 0;
      let startIndex = cleanedText.indexOf("[");
      let endIndex = -1;

      if (startIndex !== -1) {
        for (let i = startIndex; i < cleanedText.length; i++) {
          if (cleanedText[i] === "[") bracketCount++;
          if (cleanedText[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
      }

      let jsonString = null;
      if (startIndex !== -1 && endIndex !== -1) {
        jsonString = cleanedText.substring(startIndex, endIndex);
      } else {
        // Fallback to regex
        const jsonMatch = cleanedText.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
      }

      if (jsonString) {
        try {
          const parsed = JSON.parse(jsonString);
          if (Array.isArray(parsed)) {
            careers = parsed.map((item: any) => ({
              title: item.title || item.name || "",
              description: item.description || "",
              salary: item.salary || "",
              jobOutlook: item.jobOutlook || item.job_outlook || "",
              competitiveness: item.competitiveness || "",
              matchReason: item.matchReason || item.match_reason || item.reason || "",
            }));
          }
        } catch (e) {
          console.error("Failed to parse JSON array:", e);
        }
      }

      // If still no careers, try parsing the whole response
      if (careers.length === 0) {
        try {
          const parsed = JSON.parse(cleanedText);
          if (Array.isArray(parsed)) {
            careers = parsed.map((item: any) => ({
              title: item.title || item.name || "",
              description: item.description || "",
              salary: item.salary || "",
              jobOutlook: item.jobOutlook || item.job_outlook || "",
              competitiveness: item.competitiveness || "",
              matchReason: item.matchReason || item.match_reason || item.reason || "",
            }));
          }
        } catch (e) {
          console.error("Failed to parse full response:", e);
        }
      }
    } catch (parseError) {
      console.error("Error parsing careers:", parseError);
    }

    // Validate careers have required fields
    careers = careers.filter(
      (c: any) =>
        c.title &&
        typeof c.title === "string" &&
        c.title.trim().length > 0
    );

    console.log("Parsed careers count:", careers.length);
    if (careers.length > 0) {
      console.log("First career:", JSON.stringify(careers[0], null, 2));
    } else {
      console.error("No careers parsed! Full response:", generatedText);
    }

    return NextResponse.json({ careers });
  } catch (error: any) {
    console.error("Error getting career assessment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get career assessment" },
      { status: 500 }
    );
  }
}

