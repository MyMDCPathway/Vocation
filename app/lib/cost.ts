// Estimated-cost model for pathway steps, used by the pathway page and the
// career-comparison view to show an approximate total cost per pathway.
import { PathwayStep } from "@/app/lib/types";

// Calculate estimated cost (USD) for a single pathway step.
export const calculateStepCost = (step: PathwayStep): number => {
  // MDC Associate programs (A.A. or A.S.)
  if (step.type === "degree" && step.level.includes("MDC")) {
    if (step.name.toLowerCase().includes("associate")) {
      // MDC Associate degree: ~$6,000 - $8,000 for 60 credits
      // MDC in-state tuition: ~$100-120 per credit hour
      return 7200; // 60 credits × $120
    }
    if (step.name.toLowerCase().includes("certificate")) {
      // MDC Certificate: ~$2,000 - $4,000 (typically 15-30 credits)
      return 3000;
    }
    if (step.name.toLowerCase().includes("bachelor")) {
      // MDC Bachelor's: ~$12,000 - $15,000 for remaining 60 credits after A.A./A.S.
      return 13500; // 60 credits × $120 + fees
    }
  }

  // Transfer to 4-year university
  if (step.type === "transfer") {
    // No direct cost for transfer step itself, but prepare for university costs
    return 0;
  }

  // Bachelor's degree at 4-year university (after transfer)
  if (step.type === "degree" && (step.name.toLowerCase().includes("b.s") ||
      step.name.toLowerCase().includes("b.a") ||
      step.name.toLowerCase().includes("bachelor"))) {
    // If not MDC, estimate 4-year university cost
    if (!step.level.includes("MDC")) {
      // Average public university in Florida: ~$6,000-7,000 per year for in-state
      // For 2 years after transfer: ~$12,000-14,000
      return 13000; // 2 years × $6,500
    }
  }

  // Licensure exams
  if (step.type === "exam") {
    // Exam fees typically $100 - $500, some are more expensive
    const examName = step.name.toLowerCase();
    if (examName.includes("nclex")) return 200; // NCLEX-RN/PN
    if (examName.includes("pe exam") || examName.includes("principles and practice")) return 375; // PE exam
    if (examName.includes("fe exam") || examName.includes("fundamentals")) return 175; // FE exam
    if (examName.includes("are") || examName.includes("architect registration")) return 1200; // A.R.E. has multiple divisions (5-6 exams × $200)
    if (examName.includes("bar exam")) return 1000; // Bar exam
    if (examName.includes("cpa")) return 800; // CPA exam (4 parts)
    return 300; // Default exam fee
  }

  // Internships (usually unpaid or minimal cost)
  if (step.type === "internship") {
    return 0; // Typically no cost, might have opportunity cost but not direct tuition
  }

  return 0;
};

// Sum the estimated cost of every step in a pathway. This is the single source
// of truth for the "Total" figure shown on a pathway and for each career in the
// side-by-side comparison view.
export const calculatePathwayCost = (steps: PathwayStep[]): number =>
  steps.reduce((total, step) => total + calculateStepCost(step), 0);
