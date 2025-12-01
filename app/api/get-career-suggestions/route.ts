import { NextRequest, NextResponse } from "next/server";

// Server-side only - never exposed to the browser
const apiKey = process.env.GEMINI_API_KEY;
const genModel = "gemini-2.5-flash-preview-09-2025";

export async function POST(request: NextRequest) {
  if (!apiKey) {
    console.error("GEMINI_API_KEY not configured");
    // Return empty suggestions instead of error to prevent UI breaking
    return NextResponse.json(
      { suggestions: [], error: "API key not configured" },
      { status: 200 }
    );
  }

  try {
    const { input } = await request.json();

    if (!input || typeof input !== "string" || input.trim() === "") {
      // Return empty suggestions instead of error to prevent UI breaking
      return NextResponse.json(
        {
          suggestions: [],
          error: "Input parameter is required and must be a non-empty string.",
        },
        { status: 200 }
      );
    }

    const prompt = `You are a career advisor. A user has entered "${input}" as a career interest. 

IMPORTANT: Always return career suggestions. Only return an empty array [] if the input is completely nonsensical (like "banana123" or "xyzabc"). 

Your task is to:
1. If "${input}" is a broad career category (like "software", "nurse", "mechanic", "engineer", "teacher", "doctor", "lawyer"), identify 3-6 specific career titles within that category.
2. If "${input}" is itself a specific, recognized job title/career, include it as the FIRST item, then add 2-5 related careers.
3. For ANY career-related term (broad, specific, or partial), ALWAYS return 3-6 careers. Never return empty unless the input is completely unrelated to any real career.

Return ONLY a valid JSON array. Each object must have these exact fields: "title", "description", "salary", "jobOutlook", "competitiveness". Return 3-6 items.

Field formats:
- "title": Exact job title (string)
- "description": 1-2 sentence description (string)
- "salary": Salary range like "$75,000 - $85,000" (string)
- "jobOutlook": "High demand", "Growing field", "Moderate demand", or "Competitive" (string)
- "competitiveness": "Highly competitive", "Moderately competitive", "Less competitive", or "Very competitive" (string)

Examples:
- If input is "software" (broad term):
[{"title": "Software Engineer", "description": "Designs and develops software applications and systems.", "salary": "$100,000 - $130,000", "jobOutlook": "High demand", "competitiveness": "Moderately competitive"}, {"title": "Software Developer", "description": "Creates and maintains software programs and applications.", "salary": "$95,000 - $120,000", "jobOutlook": "High demand", "competitiveness": "Moderately competitive"}, {"title": "Full Stack Developer", "description": "Works on both front-end and back-end of web applications.", "salary": "$105,000 - $135,000", "jobOutlook": "High demand", "competitiveness": "Moderately competitive"}, {"title": "DevOps Engineer", "description": "Manages software development and IT operations processes.", "salary": "$110,000 - $140,000", "jobOutlook": "High demand", "competitiveness": "Moderately competitive"}, {"title": "Mobile App Developer", "description": "Creates applications for mobile devices and platforms.", "salary": "$90,000 - $125,000", "jobOutlook": "High demand", "competitiveness": "Moderately competitive"}]

- If input is "nurse" (broad term):
[{"title": "Registered Nurse", "description": "Provides patient care, administers medications, and coordinates with healthcare teams in hospitals, clinics, and other medical settings.", "salary": "$75,000 - $85,000", "jobOutlook": "High demand", "competitiveness": "Less competitive"}, {"title": "Certified Registered Nurse Anesthetist (CRNA)", "description": "Advanced practice nurse who administers anesthesia and provides anesthesia-related care to patients.", "salary": "$195,000 - $210,000", "jobOutlook": "High demand", "competitiveness": "Highly competitive"}, {"title": "Certified Nurse-Midwife (CNM)", "description": "Advanced practice nurse specializing in women's health, pregnancy, childbirth, and postpartum care.", "salary": "$115,000 - $130,000", "jobOutlook": "Growing field", "competitiveness": "Moderately competitive"}, {"title": "Nurse Practitioner", "description": "Advanced practice registered nurse who provides primary and specialty healthcare services.", "salary": "$110,000 - $125,000", "jobOutlook": "High demand", "competitiveness": "Moderately competitive"}]

- If input is "mechanic" (broad term):
[{"title": "Automotive Service Technician and Mechanic", "description": "Diagnoses, repairs, and maintains cars and light trucks.", "salary": "$47,000 - $55,000", "jobOutlook": "Moderate demand", "competitiveness": "Less competitive"}, {"title": "Diesel Service Technician and Mechanic", "description": "Repairs and maintains diesel engines in trucks, buses, and other heavy vehicles.", "salary": "$58,000 - $65,000", "jobOutlook": "Moderate demand", "competitiveness": "Less competitive"}, {"title": "Aircraft Mechanic", "description": "Maintains and repairs aircraft to ensure safe flight operations.", "salary": "$65,000 - $75,000", "jobOutlook": "Growing field", "competitiveness": "Moderately competitive"}, {"title": "Heavy Equipment Mechanic", "description": "Repairs and maintains construction and mining equipment.", "salary": "$55,000 - $63,000", "jobOutlook": "Moderate demand", "competitiveness": "Less competitive"}]

Input: "${input}"
Return the JSON array (never empty unless input is completely nonsensical):`;

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
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      // Return empty suggestions instead of error to prevent UI breaking
      return NextResponse.json(
        { suggestions: [], error: `Gemini API error: ${response.statusText}` },
        { status: 200 }
      );
    }

    const data = await response.json();
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      console.warn("No response from Gemini API");
      // Return empty suggestions instead of error
      return NextResponse.json(
        { suggestions: [], error: "No response from Gemini API" },
        { status: 200 }
      );
    }

    console.log("Gemini response text (first 1000 chars):", generatedText.substring(0, 1000));

    // Try to extract JSON array from the response
    let suggestions: Array<{ title: string; description: string; salary: string; jobOutlook: string; competitiveness: string }> = [];
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = generatedText.trim();
      cleanedText = cleanedText.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      
      // Look for JSON array in the response - try multiple strategies
      // Strategy 1: Find balanced brackets
      let bracketCount = 0;
      let startIndex = cleanedText.indexOf('[');
      let endIndex = -1;
      
      if (startIndex !== -1) {
        for (let i = startIndex; i < cleanedText.length; i++) {
          if (cleanedText[i] === '[') bracketCount++;
          if (cleanedText[i] === ']') {
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
      } else if (startIndex !== -1) {
        // Response is incomplete - try to extract complete objects
        // Find all complete JSON objects before the truncation
        const partialJson = cleanedText.substring(startIndex);
        // Try to find complete objects by matching braces
        const objectMatches = [];
        let currentObject = '';
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < partialJson.length; i++) {
          const char = partialJson[i];
          
          if (escapeNext) {
            currentObject += char;
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            currentObject += char;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            currentObject += char;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              if (braceCount === 0) {
                currentObject = '{';
              } else {
                currentObject += char;
              }
              braceCount++;
            } else if (char === '}') {
              currentObject += char;
              braceCount--;
              if (braceCount === 0) {
                objectMatches.push(currentObject);
                currentObject = '';
              }
            } else {
              currentObject += char;
            }
          } else {
            currentObject += char;
          }
        }
        
        // If we found complete objects, try to parse them
        if (objectMatches.length > 0) {
          try {
            const objectsArray = '[' + objectMatches.join(',') + ']';
            const parsed = JSON.parse(objectsArray);
            if (Array.isArray(parsed)) {
              suggestions = parsed.map((item: any) => {
                if (typeof item === "string") {
                  return { title: item, description: "", salary: "", jobOutlook: "", competitiveness: "" };
                }
                return {
                  title: item.title || item.name || "",
                  description: item.description || "",
                  salary: item.salary || "",
                  jobOutlook: item.jobOutlook || item.job_outlook || "",
                  competitiveness: item.competitiveness || "",
                };
              });
            }
          } catch (e) {
            console.error("Failed to parse extracted objects:", e);
          }
        }
      } else {
        // Fallback to regex
        const jsonMatch = cleanedText.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
      }
      
      // If we still don't have suggestions and have a jsonString, try parsing it
      if (suggestions.length === 0 && jsonString) {
        try {
          const parsed = JSON.parse(jsonString);
          // Handle both old format (strings) and new format (objects)
          if (Array.isArray(parsed)) {
            suggestions = parsed.map((item: any) => {
              if (typeof item === "string") {
                return { title: item, description: "", salary: "", jobOutlook: "", competitiveness: "" };
              }
              return {
                title: item.title || item.name || "",
                description: item.description || "",
                salary: item.salary || "",
                jobOutlook: item.jobOutlook || item.job_outlook || "",
                competitiveness: item.competitiveness || "",
              };
            });
          }
        } catch (e) {
          console.error("Failed to parse JSON array:", e, "JSON string (first 200):", jsonString?.substring(0, 200));
        }
      }
      
      // If still no suggestions, try parsing the whole response
      if (suggestions.length === 0) {
        try {
          const parsed = JSON.parse(cleanedText);
          if (Array.isArray(parsed)) {
            suggestions = parsed.map((item: any) => {
              if (typeof item === "string") {
                return { title: item, description: "", salary: "", jobOutlook: "", competitiveness: "" };
              }
              return {
                title: item.title || item.name || "",
                description: item.description || "",
                salary: item.salary || "",
                jobOutlook: item.jobOutlook || item.job_outlook || "",
                competitiveness: item.competitiveness || "",
              };
            });
          }
        } catch (e) {
          console.error("Failed to parse full response:", e);
        }
      }
    } catch (parseError) {
      console.error("Error parsing suggestions:", parseError);
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
        .map((line: string) => ({
          title: line.replace(/^[-•*]\s*/, "").replace(/^["']|["']$/g, ""),
          description: "",
          salary: "",
          jobOutlook: "",
          competitiveness: "",
        }))
        .slice(0, 6);
    }

    // Validate suggestions have titles
    suggestions = suggestions.filter(
      (s: any) => s.title && typeof s.title === "string" && s.title.trim().length > 0
    );

    console.log("Parsed suggestions count:", suggestions.length);
    if (suggestions.length > 0) {
      console.log("First suggestion:", JSON.stringify(suggestions[0], null, 2));
    } else {
      console.error("No suggestions parsed! Full response:", generatedText);
    }

    // If we have no suggestions after all parsing attempts, return empty array instead of error
    if (suggestions.length === 0) {
      console.warn("No suggestions parsed, returning empty array");
      return NextResponse.json({ suggestions: [] });
    }

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Error getting career suggestions:", error);
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json(
      { suggestions: [], error: error.message || "Failed to get career suggestions" },
      { status: 200 } // Return 200 with empty array instead of 500
    );
  }
}

