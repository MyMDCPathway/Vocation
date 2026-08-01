// Generating a pathway for a school we have no catalog for.
//
// pathwayPrompts.ts handles the 53 schools whose program lists were scraped:
// the prompt embeds the real catalog and the model must pick from it, so it
// cannot invent a degree. That is the strongest grounding available and it
// stays exactly as it is.
//
// This file handles everywhere else. There is no list to constrain against, so
// the grounding has to come from somewhere else — and it comes from making the
// model commit to a checkable claim. Along with each program it must state the
// URL of that program's page. The server then fetches it (urlVerify.ts). A
// program whose page doesn't exist is a program the student is told we could
// not confirm.
//
// That is weaker than a scraped catalog and the UI says so. What it is not is
// the 1.0 failure mode, where a fabricated degree was indistinguishable from a
// real one all the way to the student's screen.

import type { SchoolRef } from "@/app/lib/schoolRef";
import { countryName } from "@/app/lib/countries";

export interface OpenPathwayRequest {
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
        description: `The career name only (e.g., "${canonicalCareer}"). No "Pathway to becoming a" prefix.`,
      },
      pathways: {
        type: "ARRAY",
        description:
          "Alternative routes to the career at this school. One entry if only one route exists.",
        items: {
          type: "OBJECT",
          properties: {
            title: {
              type: "STRING",
              description: "Short title for this route, naming the starting program.",
            },
            isPrimary: {
              type: "BOOLEAN",
              description: "True for the most direct/recommended route.",
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
                      "The credential and where it's earned, e.g. 'B.S. (Harvard)', 'M.D.', 'Licensure Exam'.",
                  },
                  name: {
                    type: "STRING",
                    description:
                      "The program, exam, or step. For a degree step this MUST be the program's real title as the school lists it.",
                  },
                  description: {
                    type: "STRING",
                    description: "1-3 sentences on what happens at this step and why it matters.",
                  },
                  programUrl: {
                    type: "STRING",
                    description:
                      "For a degree step at THIS school: your best URL for that program's own page on the school's website. Empty string for exams, internships, transfers, and for degrees earned elsewhere. This URL WILL BE FETCHED and checked — a wrong one is detected, so give your genuine best attempt rather than a plausible-looking guess.",
                  },
                },
                required: ["type", "level", "name", "description", "programUrl"],
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

function systemPrompt(school: SchoolRef, canonicalCareer: string): string {
  const location = [school.city, school.subdivision, countryName(school.countryCode)]
    .filter(Boolean)
    .join(", ");

  return `You are an academic advisor at ${school.name} in ${location}. Generate a complete educational pathway for a student starting at ${school.name} who wants to become a "${canonicalCareer}".

ACCURACY — READ THIS FIRST:
You are being asked about a real institution, and a student may act on what you say. Two rules follow:

1. Name only programs ${school.name} ACTUALLY OFFERS. If you are unsure whether this school offers a specific program, name the broader program you are confident it offers instead. "Bachelor of Science in Biology" that exists beats "Bachelor of Science in Pre-Medical Studies" that doesn't.
2. For every degree step at ${school.name}, give programUrl: your best URL for that program's page on the school's own website. **These URLs are fetched and checked by our server.** A URL that 404s is detected and the student is told the program could not be confirmed. So a genuine best attempt is far more useful than a confident-looking guess — and if you truly don't know the URL pattern, give the school's program index rather than inventing a path.

STRUCTURE:
Build the pathway around how education actually works in ${countryName(school.countryCode)}, not around the American model by default. Some countries go straight from secondary school into a professional degree; some require a general first degree first; licensing bodies differ everywhere.

Include, in a sensible order:
1. The starting program at ${school.name} — always first, type 'degree'.
2. Any further degrees the career requires, at this school or elsewhere. If the student must go elsewhere, say so plainly and leave programUrl empty for that step.
3. Required practical experience, placements, residencies, or supervised hours — type 'internship'.
4. Required licensing exams or professional registration for ${countryName(school.countryCode)} — type 'exam'. Name the actual body and exam, not a generic "licensing exam".
5. Optional further qualifications where they genuinely change the career.

FIELDS:
- 'level' states the credential and, for steps at this school, the school: "B.S. (${school.name})".
- 'name' for a degree step is the program's real title.
- 'programUrl' only for degree steps at ${school.name}. Empty string otherwise.

Give more than one pathway only when ${school.name} genuinely offers more than one route in. Mark the most direct with isPrimary: true.

Respond only with JSON matching the schema.`;
}

function userQuery(school: SchoolRef, canonicalCareer: string): string {
  return `Generate the educational pathway(s) to becoming a "${canonicalCareer}", starting at ${school.name}${
    school.city ? ` in ${school.city}` : ""
  }.

Remember: only programs this school really offers, real licensing bodies for ${countryName(
    school.countryCode
  )}, and a genuine best-effort programUrl for every degree step at this school — those URLs get fetched and checked.${
    school.programsUrl
      ? `\n\nThe school's program index is ${school.programsUrl}, which may help you infer its URL pattern.`
      : ""
  }`;
}

export function buildOpenPathwayRequest(
  school: SchoolRef,
  canonicalCareer: string
): OpenPathwayRequest {
  return {
    systemPrompt: systemPrompt(school, canonicalCareer),
    userQuery: userQuery(school, canonicalCareer),
    responseSchema: buildResponseSchema(canonicalCareer),
  };
}
