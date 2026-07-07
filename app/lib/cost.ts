// Estimated-cost model for pathway steps, used by the pathway page and the
// career-comparison view to show an approximate total cost per pathway.
//
// Costs are expressed as ranges (low/high USD) rather than single figures —
// the underlying numbers are rough estimates, and a range communicates that
// honestly. All figures cover tuition & fees only: housing, books, and
// financial aid are intentionally out of scope (the UI says so).
import { PathwayStep } from "@/app/lib/types";
import { FLORIDA_UNIVERSITIES } from "@/app/lib/universities";

export interface CostRange {
  low: number;
  high: number;
}

const ZERO: CostRange = { low: 0, high: 0 };
const flat = (amount: number): CostRange => ({ low: amount, high: amount });

// MDC in-state estimates (tuition & fees).
const MDC_ASSOCIATE: CostRange = { low: 6000, high: 8000 }; // 60 credits @ ~$100-120/credit
const MDC_CERTIFICATE: CostRange = { low: 2000, high: 4000 }; // typically 15-30 credits
const MDC_BACHELORS: CostRange = { low: 12000, high: 15000 }; // upper-division 60 credits + fees

// Fallback for a bachelor's at an unrecognized 4-year school: assume a Florida
// public university (2 years after transfer).
const DEFAULT_UNIVERSITY_2YR: CostRange = { low: 12000, high: 15000 };

// Years typically spent at a university finishing a bachelor's after transfer.
const YEARS_AFTER_TRANSFER = 2;

// Find the annual cost of the university named in a step, matching either the
// university's full name ("University of Miami") or its abbreviation ("FIU")
// against the step's text.
export function findUniversityCost(stepText: string): CostRange | null {
  const text = stepText.toLowerCase();
  for (const uni of FLORIDA_UNIVERSITIES) {
    const fullName = uni.name.replace(/\s*\([^)]*\)/, "").toLowerCase();
    if (text.includes(fullName)) {
      return uni.annualCost;
    }
    const abbrMatch = uni.name.match(/\(([^)]+)\)/);
    if (abbrMatch) {
      const abbr = abbrMatch[1].toLowerCase();
      if (new RegExp(`\\b${abbr}\\b`).test(text)) {
        return uni.annualCost;
      }
    }
  }
  return null;
}

// Calculate the estimated cost range (USD) for a single pathway step.
export const calculateStepCostRange = (step: PathwayStep): CostRange => {
  // MDC programs (associate, certificate, or bachelor's)
  if (step.type === "degree" && step.level.includes("MDC")) {
    const name = step.name.toLowerCase();
    if (name.includes("associate")) return MDC_ASSOCIATE;
    if (name.includes("certificate")) return MDC_CERTIFICATE;
    if (name.includes("bachelor")) return MDC_BACHELORS;
  }

  // Transfer step itself has no direct cost
  if (step.type === "transfer") {
    return ZERO;
  }

  // Bachelor's completed at a 4-year university after transfer
  if (step.type === "degree" && (step.name.toLowerCase().includes("b.s") ||
      step.name.toLowerCase().includes("b.a") ||
      step.name.toLowerCase().includes("bachelor"))) {
    if (!step.level.includes("MDC")) {
      // Use the named university's real tuition when we can identify it —
      // public vs. private makes a 4-9x difference.
      const annual = findUniversityCost(`${step.level} ${step.name}`);
      if (annual) {
        return {
          low: annual.low * YEARS_AFTER_TRANSFER,
          high: annual.high * YEARS_AFTER_TRANSFER,
        };
      }
      return DEFAULT_UNIVERSITY_2YR;
    }
  }

  // Licensure exams — registration fees are published, so these are flat.
  if (step.type === "exam") {
    // Strip periods so "A.R.E." and "F.E." match, and use word boundaries so
    // e.g. "Health Care Exam" doesn't match "are".
    const examName = step.name.toLowerCase().replace(/\./g, "");
    if (examName.includes("nclex")) return flat(200); // NCLEX-RN/PN
    if (/\bpe\b/.test(examName) || examName.includes("principles and practice")) return flat(375); // PE exam
    if (/\bfe\b/.test(examName) || examName.includes("fundamentals")) return flat(175); // FE exam
    if (/\bare\b/.test(examName) || examName.includes("architect registration")) return flat(1200); // A.R.E. (6 divisions)
    if (examName.includes("bar exam")) return flat(1000); // Bar exam
    if (examName.includes("cpa")) return flat(800); // CPA exam (4 parts)
    return flat(300); // Default exam fee
  }

  // Internships: typically unpaid or no direct tuition cost
  if (step.type === "internship") {
    return ZERO;
  }

  return ZERO;
};

// Sum the estimated cost range of every step in a pathway. This is the single
// source of truth for the "Total" figure shown on a pathway and for each
// career in the side-by-side comparison view.
export const calculatePathwayCostRange = (steps: PathwayStep[]): CostRange =>
  steps.reduce(
    (total, step) => {
      const cost = calculateStepCostRange(step);
      return { low: total.low + cost.low, high: total.high + cost.high };
    },
    { low: 0, high: 0 }
  );

// Format a cost range for display: "$6,000 – $8,000", or "$200" when the
// range collapses to a single known fee.
export const formatCostRange = (range: CostRange): string => {
  if (range.low === range.high) {
    return `$${range.low.toLocaleString()}`;
  }
  return `$${range.low.toLocaleString()} – $${range.high.toLocaleString()}`;
};
