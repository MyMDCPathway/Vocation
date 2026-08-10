"use client";

// Where a half-finished intake lives between renders.
//
// sessionStorage, not localStorage and not a cookie:
//
//   - Not a cookie. The school cookie exists because the SERVER has to know
//     the school before it renders (see HANDOFF §6). Nothing about the intake
//     is needed server-side before paint, so putting it in a cookie would
//     just send income and location on every request for no benefit.
//   - Not localStorage. Answers about your family's income shouldn't outlive
//     the tab you typed them in. sessionStorage clears itself when the tab
//     closes, which is the right default for this data.
//
// Nothing here is ever sent anywhere except to /api/plan-tracks, which uses it
// to rank schools and returns no record of it.

import { EMPTY_INTAKE, type IntakeAnswers } from "@/app/lib/intake";

const STORAGE_KEY = "vocation_intake";

export function loadIntake(): IntakeAnswers {
  if (typeof window === "undefined") return EMPTY_INTAKE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IntakeAnswers) : EMPTY_INTAKE;
  } catch {
    // A malformed or blocked store should start the student at question one,
    // not crash the page they just landed on.
    return EMPTY_INTAKE;
  }
}

export function saveIntake(answers: IntakeAnswers): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // Private browsing and full quotas both throw here. Losing persistence is
    // survivable; the wizard keeps its own copy in React state.
  }
}

export function clearIntake(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* see saveIntake */
  }
}
